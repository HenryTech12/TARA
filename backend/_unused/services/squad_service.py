import httpx
import logging
from sqlalchemy.orm import Session
from app.core.config import settings
from app.services.audit_service import write_audit_event
from app.models.enums import DecisionStatus

logger = logging.getLogger(__name__)

class SquadService:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {settings.squad_secret_key_1}",
            "Content-Type": "application/json"
        }

    async def trigger_ussd_verification(self, account_id: str, payload: dict, db: Session = None):
        """
        Calls Squad Transaction API to initiate a USSD payment/verification flow.
        Aligned with Squad Documentation: POST /transaction/initiate/process-payment
        """
        logger.info(f"Triggering USSD verification for {account_id}")
        url = f"{settings.squad_api_base_url}{settings.squad_ussd_endpoint}"
        
        data = {
            "transaction_reference": f"TARA-USSD-{payload.get('transaction_ref')}",
            "amount": int(float(payload.get("amount", 0)) * 100), # Amount in kobo
            "pass_charge": False,
            "currency": "NGN",
            "webhook_url": settings.squad_webhook_url,  # set via SQUAD_WEBHOOK_URL env var
            "ussd": {
                "bank_code": payload.get("bank_code", "058") # Default to GTB if not provided
            },
            "payment_method": "ussd",
            "customer": {
                "name": payload.get("sender_name", "TARA Verified User"),
                "email": payload.get("email", "support@tara.com")
            }
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=data, headers=self.headers)
                response.raise_for_status()
                res_data = response.json()
                
                if db:
                    write_audit_event(
                        db=db,
                        action="autonomous_ussd_triggered",
                        entity_ids=[account_id],
                        alert_id=None,
                        model_version="tara_v1",
                        decision=DecisionStatus.pending,
                        payload_json={"request": data, "response": res_data}
                    )
                    db.commit()
                
                return res_data
            except Exception as e:
                logger.error(f"Failed to initiate USSD payment: {e}")
                if db:
                    write_audit_event(
                        db=db,
                        action="autonomous_ussd_failed",
                        entity_ids=[account_id],
                        alert_id=None,
                        model_version="tara_v1",
                        decision=DecisionStatus.escalated,
                        payload_json={"error": str(e), "request": data}
                    )
                    db.commit()
                return None

    async def quarantine_funds(self, payload: dict, db: Session = None):
        """
        Calls Squad Transfer API to 'quarantine' the funds into a specific Virtual Account.
        Aligned with Squad Documentation: POST /payout/transfer
        """
        transaction_ref = payload.get('transaction_ref')
        logger.info(f"Quarantining funds for transaction {transaction_ref}")
        url = f"{settings.squad_api_base_url}{settings.squad_transfer_endpoint}"
        
        # Square documentation requires Merchant ID to be prepended to transaction_reference
        merchant_id = getattr(settings, 'squad_merchant_id', 'TARA')
        tx_ref = f"{merchant_id}_{transaction_ref}"

        data = {
            "remark": "Flagged as High Risk by TARA",
            "bank_code": payload.get("bank_code", "058"),
            "currency_id": "NGN",
            "amount": str(int(float(payload.get("amount", 0)))),
            "account_number": settings.squad_quarantine_account,
            "transaction_reference": tx_ref,
            "account_name": "TARA QUARANTINE POOL"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=data, headers=self.headers)
                response.raise_for_status()
                res_data = response.json()

                if db:
                    write_audit_event(
                        db=db,
                        action="autonomous_quarantine_triggered",
                        entity_ids=[payload.get("sender_id", "unknown")],
                        alert_id=None,
                        model_version="tara_v1",
                        decision=DecisionStatus.approved,
                        payload_json={"request": data, "response": res_data}
                    )
                    db.commit()

                return res_data
            except Exception as e:
                logger.error(f"Failed to quarantine funds: {e}")
                if db:
                    write_audit_event(
                        db=db,
                        action="autonomous_quarantine_failed",
                        entity_ids=[payload.get("sender_id", "unknown")],
                        alert_id=None,
                        model_version="tara_v1",
                        decision=DecisionStatus.escalated,
                        payload_json={"error": str(e), "request": data}
                    )
                    db.commit()
                return None

squad_service = SquadService()
