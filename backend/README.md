# TARA Backend

Backend service for TARA (Trust And Relationship Analysis) — an identity network
trust layer built on the QoreID verification API. Adapted from the VERA/GRACE
financial fraud detection backend for TiT 6.0.

## Run locally

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # fill in POSTGRES_URL, QOREID_CLIENT_ID, QOREID_API_KEY
uvicorn app.main:app --reload --port 8000
```

## Seed the demo dataset

```bash
cd backend
python scripts/seed_demo_data.py
```

## Key endpoints

```
POST /api/v1/identities/verify     Verify an identity via QoreID (live if creds are set, stub otherwise) and add it to the graph
GET  /api/v1/verdict/{identity_id} Run detection patterns, return trust score + verdict
GET  /api/v1/graph                 Full identity graph (nodes + links)
GET  /health                       Health check
```

Note: the Lua agent bridge, Squad webhooks, entities/transactions/alerts/audit/
responsible-ai routes, Neo4j, and the Celery/Redis-style ingest worker are out of
scope for TARA and are commented out at the router level — see `app/api/router.py`.
