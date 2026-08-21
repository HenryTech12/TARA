import httpx
import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends
from app.core.config import settings
from app.schemas.squad import TransferRequest, SimulateWebhookRequest

router = APIRouter()
logger = logging.getLogger(__name__)

SQUAD_URL = "https://sandbox-api-d.squadco.com"

@router.post("/initiate")
async def initiate_demo_transfer(payload: TransferRequest):
    """
    UI calls this to start a payment.
    TARA calls Squad -> Squad processes -> Squad sends Webhook to you.
    """
    headers = {
        "Authorization": f"Bearer {settings.squad_secret_key_1}",
        "Content-Type": "application/json"
    }
    
    # Unique reference is required so Squad knows it's a new transaction
    tx_ref = f"TARA_DEMO_{uuid.uuid4().hex[:8].upper()}"
    
    data = {
        "transaction_reference": tx_ref,
        "amount": str(payload.amount),
        "bank_code": payload.bank_code,
        "account_number": payload.account_number,
        "account_name": payload.account_name,
        "currency_id": "NGN",
        "remark": payload.remark
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{SQUAD_URL}/payout/transfer", json=data, headers=headers)
        
    if response.status_code != 200:
        logger.error(f"Squad Error: {response.text}")
        raise HTTPException(status_code=400, detail="Squad Transfer Failed")
        
    return {"status": "success", "tx_ref": tx_ref, "squad_response": response.json()}

@router.post("/simulate-webhook")
async def simulate_squad_webhook(payload: SimulateWebhookRequest):
    """
    THE HACKATHON SECRET WEAPON:
    If the internet is slow, use this to force Squad to send the webhook 
    to your ngrok URL immediately.
    """
    headers = {"Authorization": f"Bearer {settings.squad_secret_key_1}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SQUAD_URL}/virtual-account/simulate/payment",
            json=payload.model_dump(),
            headers=headers
        )
    
    return response.json()