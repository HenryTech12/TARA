from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone

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

    Goes live automatically once QOREID_API_KEY is set (see .env.example).
    Without a key it always uses the deterministic stub. With a key, a
    failed live call (timeout, non-2xx, network flake) falls back to the
    stub rather than blowing up the demo — but the fallback is always
    marked in raw_response so nobody mistakes a stubbed result for a real
    QoreID verification.
    """

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
        if settings.qoreid_api_key:
            try:
                return await self._verify_live(bvn, nin, first_name, last_name)
            except Exception as exc:
                logger.warning("QoreID live call failed, falling back to stub: %s", exc)
                result = self._verify_stub(bvn, nin, first_name, last_name)
                result["raw_response"]["fallback"] = True
                result["raw_response"]["fallback_reason"] = str(exc)
                return result

        return self._verify_stub(bvn, nin, first_name, last_name)

    async def _verify_live(
        self,
        bvn: str | None,
        nin: str | None,
        first_name: str | None,
        last_name: str | None,
    ) -> dict:
        """Real QoreID call. Payload/response shape is a best-guess placeholder
        pending confirmation of the exact contract at the TiT 6.0 track brief —
        adjust the request body and response field lookups below once that's
        confirmed, the seam in verify_identity() above doesn't need to change.
        """
        async with httpx.AsyncClient(
            base_url=settings.qoreid_base_url,
            headers={
                "Authorization": f"Bearer {settings.qoreid_api_key}",
                "Content-Type": "application/json",
            },
            timeout=15.0,
        ) as client:
            payload = {
                "idNumber": bvn or nin,
                "idType": "bvn" if bvn else "nin",
                "firstname": first_name,
                "lastname": last_name,
            }
            response = await client.post("/identities/verify", json=payload)
            response.raise_for_status()
            data = response.json()

        data["provider"] = "qoreid_live"
        return {
            "verified": data.get("status") == "verified",
            "confidence": data.get("confidence", None),
            "matched_name": data.get("data", {}).get("fullName"),
            "matched_dob": data.get("data", {}).get("dateOfBirth"),
            "matched_phone": data.get("data", {}).get("phoneNumber"),
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
