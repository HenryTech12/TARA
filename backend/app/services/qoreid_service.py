from __future__ import annotations

import hashlib
from datetime import datetime, timezone


class QoreIDService:
    """Adapter over QoreID's identity verification API.

    The route layer (app/api/routes/identities.py) only ever calls
    verify_identity() and reads the response dict below — it has zero
    knowledge of whether this method is backed by the stub or a real HTTP
    call. That is the seam: swapping the method body is the only change
    required once sandbox credentials are issued.
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

        # ------------------------------------------------------------------
        # REAL QOREID CALL GOES HERE — uncomment and fill in once sandbox
        # credentials are issued at the TiT 6.0 track brief. Everything
        # below this comment block is the stub; delete it when uncommenting.
        # ------------------------------------------------------------------
        #
        # import httpx
        # from app.core.config import settings
        #
        # QOREID_BASE_URL = settings.qoreid_base_url  # confirm exact URL at track brief
        #
        # async with httpx.AsyncClient(
        #     base_url=QOREID_BASE_URL,
        #     headers={
        #         "Authorization": f"Bearer {settings.qoreid_api_key}",
        #         "Content-Type": "application/json",
        #     },
        #     timeout=15.0,
        # ) as client:
        #     payload = {
        #         "idNumber": bvn or nin,
        #         "idType": "bvn" if bvn else "nin",
        #         "firstname": first_name,
        #         "lastname": last_name,
        #     }
        #     response = await client.post("/identities/verify", json=payload)
        #     response.raise_for_status()
        #     data = response.json()
        #
        # return {
        #     "verified": data.get("status") == "verified",
        #     "confidence": data.get("confidence", None),
        #     "matched_name": data.get("data", {}).get("fullName"),
        #     "matched_dob": data.get("data", {}).get("dateOfBirth"),
        #     "matched_phone": data.get("data", {}).get("phoneNumber"),
        #     "raw_response": data,
        # }
        # ------------------------------------------------------------------

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
