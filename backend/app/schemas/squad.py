from pydantic import BaseModel, Field
from typing import Optional

class TransferRequest(BaseModel):
    # For the demo, these can be hardcoded or dynamic
    amount: int = Field(..., example=5000, description="Amount in Kobo (e.g. 5000 = 50 NGN)")
    bank_code: str = Field(default="058", description="GTBank code for sandbox")
    account_number: str = Field(default="0123456789", description="Sandbox test account")
    account_name: str = Field(default="TARA Test User")
    remark: str = Field(default="TARA Demo Transfer")

class SimulateWebhookRequest(BaseModel):
    # This helps you manually trigger the webhook during a pitch
    virtual_account_number: str
    amount: str