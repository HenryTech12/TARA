from __future__ import annotations

import hashlib
import logging
import time
from datetime import datetime, timezone
from urllib.parse import urlsplit

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class QoreIDService:
    """Adapter over QoreID's identity verification API.

    The route layer (app/api/routes/identities.py) only ever calls
    verify_identity() and reads the response dict below — it has zero
    knowledge of whether this method is backed by the stub or a real HTTP
    call. That is the seam: swapping the method body is the only change
    required once sandbox credentials are issued.

    Goes live automatically once QOREID_CLIENT_ID and QOREID_API_KEY (the
    client secret) are both set (see .env.example). Without them it always
    uses the deterministic stub. With them, a failed live call (bad auth,
    timeout, non-2xx, network flake) falls back to the stub rather than
    blowing up the demo — but the fallback is always marked in
    raw_response so nobody mistakes a stubbed result for a real QoreID
    verification.

    Endpoints and payload/response shapes below are taken directly from
    docs.qoreid.com (Authentication, BVN (Basic), NIN(with NIN) pages) —
    not guessed.
    """

    def __init__(self) -> None:
        self._token: str | None = None
        self._token_expires_at: float = 0.0

    async def verify_identity(
        self,
        bvn: str | None = None,
        nin: str | None = None,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> dict:
        """
        Verify an identity against QoreID and return a normalized result.

        Returns a dict shaped exactly as:
        {
            "verified": bool,
            "confidence": float,
            "matched_name": str | None,
            "matched_dob": str | None,
            "matched_phone": str | None,
            "raw_response": dict,
        }
        """
        if settings.qoreid_client_id and settings.qoreid_api_key:
            try:
                return await self._verify_live(bvn, nin, first_name, last_name)
            except Exception as exc:
                logger.warning("QoreID live call failed, falling back to stub: %s", exc)
                result = self._verify_stub(bvn, nin, first_name, last_name)
                result["raw_response"]["fallback"] = True
                result["raw_response"]["fallback_reason"] = str(exc)
                return result

        return self._verify_stub(bvn, nin, first_name, last_name)

    def _origin(self) -> str:
        """Scheme + host from QOREID_BASE_URL, e.g. "https://api.qoreid.com" —
        the token endpoint lives at {origin}/token, outside the /v1/ng path
        the identity endpoints use, so both are built from this."""
        parts = urlsplit(settings.qoreid_base_url)
        return f"{parts.scheme}://{parts.netloc}"

    async def _get_access_token(self) -> str:
        """POST {origin}/token with clientId + secret, returns a Bearer token.
        Cached in-process until shortly before it expires (docs.qoreid.com
        Authentication page: 201 response is {accessToken, expiresIn, tokenType})."""
        now = time.monotonic()
        if self._token and now < self._token_expires_at:
            return self._token

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{self._origin()}/token",
                headers={"Accept": "text/plain", "Content-Type": "application/json"},
                json={"clientId": settings.qoreid_client_id, "secret": settings.qoreid_api_key},
            )
            response.raise_for_status()
            data = response.json()

        try:
            expires_in = int(data.get("expiresIn", 3300))
        except (TypeError, ValueError):
            expires_in = 3300

        self._token = data["accessToken"]
        # refresh a little early so we never fire a verify call on a token
        # that expires mid-request
        self._token_expires_at = now + max(expires_in - 60, 60)
        return self._token

    async def _verify_live(
        self,
        bvn: str | None,
        nin: str | None,
        first_name: str | None,
        last_name: str | None,
    ) -> dict:
        """Real QoreID call — BVN (Basic) or NIN(with NIN), whichever id was
        supplied (BVN takes priority if both are, matching the stub)."""
        id_number = bvn or nin
        id_kind = "bvn" if bvn else "nin"

        token = await self._get_access_token()

        path = (
            f"/v1/ng/identities/bvn-basic/{id_number}"
            if id_kind == "bvn"
            else f"/v1/ng/identities/nin/{id_number}"
        )
        payload = {"firstname": first_name, "lastname": last_name}

        async with httpx.AsyncClient(
            base_url=self._origin(),
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=15.0,
        ) as client:
            response = await client.post(path, json=payload)
            response.raise_for_status()
            data = response.json()

        bio = data.get(id_kind, {})
        status = data.get("status", {})
        match = data.get("summary", {}).get(f"{id_kind}_check", {})
        field_matches = match.get("fieldMatches", {})

        matched_name = (
            " ".join(part for part in (bio.get("firstname"), bio.get("middlename"), bio.get("lastname")) if part)
            or None
        )

        if field_matches:
            confidence = sum(1 for matched in field_matches.values() if matched) / len(field_matches)
        else:
            confidence = 1.0 if match.get("status") == "EXACT_MATCH" else 0.0

        data["provider"] = "qoreid_live"
        return {
            "verified": status.get("status") == "verified",
            "confidence": round(confidence, 4),
            "matched_name": matched_name,
            # QoreID returns birthdate in its own native format (not
            # necessarily ISO) — passed through as-is, not reparsed.
            "matched_dob": bio.get("birthdate"),
            "matched_phone": bio.get("phone"),
            "raw_response": data,
        }

    def _verify_stub(
        self,
        bvn: str | None = None,
        nin: str | None = None,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> dict:
        """Deterministic pseudo-verification used when no QoreID key is
        configured, or as the fallback when a live call fails."""
        id_number = bvn or nin
        full_name = " ".join(part for part in (first_name, last_name) if part).strip()

        if not id_number or not full_name:
            raw = {
                "status": "rejected",
                "confidence": 0.0,
                "reason": "missing_id_number_or_name",
            }
            return {
                "verified": False,
                "confidence": 0.0,
                "matched_name": None,
                "matched_dob": None,
                "matched_phone": None,
                "raw_response": raw,
            }

        # Deterministic pseudo-verification: hash the id number so the same
        # identity always produces the same stubbed result across calls,
        # without needing a real QoreID connection.
        digest = hashlib.sha256(id_number.encode("utf-8")).hexdigest()
        confidence = round(0.85 + (int(digest[:4], 16) % 1500) / 10000, 4)  # 0.85–0.999
        dob_year = 1970 + (int(digest[4:6], 16) % 40)
        dob_month = 1 + (int(digest[6:8], 16) % 12)
        dob_day = 1 + (int(digest[8:10], 16) % 28)
        phone_suffix = str(int(digest[10:17], 16))[-7:].rjust(7, "0")

        raw = {
            "status": "verified",
            "confidence": confidence,
            "data": {
                "fullName": full_name,
                "dateOfBirth": f"{dob_year:04d}-{dob_month:02d}-{dob_day:02d}",
                "phoneNumber": f"080{phone_suffix}",
                "idNumber": id_number,
                "idType": "bvn" if bvn else "nin",
            },
            "verifiedAt": datetime.now(timezone.utc).isoformat(),
            "provider": "qoreid_stub",
        }
        return {
            "verified": True,
            "confidence": confidence,
            "matched_name": full_name,
            "matched_dob": raw["data"]["dateOfBirth"],
            "matched_phone": raw["data"]["phoneNumber"],
            "raw_response": raw,
        }
