# Unused (VERA carryover)

Pages, components, API modules, and hooks from the VERA/GRACE financial-fraud
frontend that aren't part of TARA's identity-trust domain and aren't
reachable from `router/index.jsx` — entities, transactions, alerts, squad,
STR reports, audit log, agent bridge, and responsible-AI metrics. Verified by
tracing every import reachable from `main.jsx` — nothing in here is
referenced by any live page or component. Moved here rather than deleted, in
case any of it is useful reference later.
