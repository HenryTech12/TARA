import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.config import settings
from app.core.deps import get_db
from app.schemas.agent import AgentIntakeRequest, AgentIntakeResponse
from app.services.str_service import create_external_str_draft


router = APIRouter()


@router.post('/agent/intake', response_model=AgentIntakeResponse)
def run_agent_intake(
    payload: AgentIntakeRequest,
    db: Session = Depends(get_db),
) -> AgentIntakeResponse:
    webhook_url = settings.lua_transaction_intake_webhook_url.strip()
    if not webhook_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Lua transaction intake webhook URL is not configured.',
        )

    headers = {'Content-Type': 'application/json'}
    if settings.lua_transaction_intake_key:
        headers['x-intake-key'] = settings.lua_transaction_intake_key
    if settings.lua_transaction_intake_bearer_token:
        headers['Authorization'] = f"Bearer {settings.lua_transaction_intake_bearer_token}"

    params: dict[str, str] = {}
    if payload.source:
        params['source'] = payload.source
    if payload.tenant:
        params['tenant'] = payload.tenant

    body = {
        'data': payload.data,
        'format': payload.format,
        'sensitivity': payload.sensitivity,
        'reason_mode': payload.reason_mode,
        'generate_report': payload.generate_report,
        **({'case_reference': payload.case_reference} if payload.case_reference else {}),
        **({'reporting_period': payload.reporting_period} if payload.reporting_period else {}),
    }

    try:
        with httpx.Client(timeout=settings.lua_transaction_intake_timeout_seconds) as client:
            response = client.post(webhook_url, params=params, headers=headers, json=body)
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f'Failed to reach Lua transaction intake webhook: {exc}',
        ) from exc

    if response.status_code >= 400:
        detail: str | dict = response.text
        try:
            detail = response.json()
        except ValueError:
            pass
        if response.status_code == status.HTTP_401_UNAUTHORIZED:
            if isinstance(detail, dict) and str(detail.get('message', '')).lower().strip() == 'no token provided':
                detail = {
                    'message': 'Upstream webhook rejected request: no bearer token provided.',
                    'hint': 'Set LUA_TRANSACTION_INTAKE_BEARER_TOKEN in backend deployment env.',
                    'upstream': detail,
                }
        raise HTTPException(status_code=response.status_code, detail=detail)

    try:
        payload_json = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail='Lua intake webhook returned a non-JSON response.',
        ) from exc

    if isinstance(payload_json, dict) and 'run_id' not in payload_json and 'runId' in payload_json:
        payload_json['run_id'] = payload_json.get('runId')

    if isinstance(payload_json, dict):
        report = payload_json.get('report')
        case_reference = payload.case_reference
        should_create_str = bool(payload.generate_report and isinstance(report, dict) and case_reference)
        if should_create_str:
            try:
                alert_id = UUID(case_reference)
                draft = create_external_str_draft(
                    db=db,
                    alert_id=alert_id,
                    report_payload=report,
                    reviewer_notes='Generated from Lua transaction intake webhook',
                    provider='lua-agent',
                    model_name='lua-transaction-intake',
                    model_version='transaction-intake',
                )
                payload_json['str_draft_id'] = str(draft.id)
            except Exception:
                pass

    try:
        return AgentIntakeResponse.model_validate(payload_json)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f'Lua intake webhook returned an unexpected schema: {exc.errors()}',
        ) from exc
