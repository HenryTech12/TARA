# TARA Frontend — TiT 6.0

React (Vite) frontend for TARA — identity network trust layer for TiT 6.0.
Adapted from the VERA/GRACE financial fraud detection frontend.

## Run locally

```bash
cd frontend
npm install
cp .env.example .env        # fill in VITE_API_BASE_URL if not using the default
npm run dev
```

Requires the backend running (see `../backend/README.md`) — defaults to
`http://localhost:8000/api/v1`.

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Pages

```
/                      Landing page
/dashboard             Identity trust overview — stat cards, flagged identities
/graph                 Force-directed graph explorer — red/amber/green risk coloring
/verify                Live identity verification form (calls QoreID via the backend)
/identities/:id        Identity attributes + relationship signals
/verdict/:id           Trust score, verdict badge, evidence, explanation
/settings              Platform settings (demo/decorative — not backend-wired)
```

Note: the Alerts, Entities, Transactions, Squad Monitor, STR Reports, Audit
Log, and Responsible-AI pages/components/API modules from VERA are out of
scope for TARA and moved to `src/_unused/` — see that folder's README. They
aren't routed and nothing in the active app imports them (verified by
tracing every import reachable from `main.jsx`).
