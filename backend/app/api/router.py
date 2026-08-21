from fastapi import APIRouter

from app.api.routes.graph import router as graph_router
from app.api.routes.identities import router as identities_router
from app.api.routes.verdict import router as verdict_router

# VERA's financial-domain routers (entities, transactions, alerts, audit,
# responsible_ai, agent) are out of scope for TARA's identity-trust domain —
# left on disk, unregistered, per TiT 6.0 PRD Section 01 repositioning.
# from app.api.routes.audit import router as audit_router
# from app.api.routes.alerts import router as alerts_router
# from app.api.routes.entities import router as entities_router
# from app.api.routes.responsible_ai import router as responsible_ai_router
# from app.api.routes.agent import router as agent_router
# from app.api.routes.transactions import router as transactions_router

# STR generation — not used in TARA (PRD Section 02, Step 3)
# from app.api.routes.str_drafts import router as str_drafts_router

# Squad webhooks — not used in TARA (PRD Section 02, Step 3)
# from app.api.routes.webhooks import router as webhooks_router
# from app.api.routes.transfers import router as transfers_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(graph_router, tags=["graph"])
api_router.include_router(identities_router, tags=["identities"])
api_router.include_router(verdict_router, tags=["verdict"])

# api_router.include_router(audit_router, tags=["audit"])
# api_router.include_router(transactions_router, tags=["transactions"])
# api_router.include_router(alerts_router, tags=["alerts"])
# api_router.include_router(entities_router, tags=["entities"])
# api_router.include_router(responsible_ai_router, tags=["responsible-ai"])
# api_router.include_router(str_drafts_router, tags=["str"])
# api_router.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
# api_router.include_router(transfers_router, prefix="/transfers", tags=["Transfers"])
