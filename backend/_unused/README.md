# Unused (VERA carryover)

Services from the VERA/GRACE financial-fraud backend that aren't part of
TARA's identity-trust domain and aren't imported by the active router
(`app/api/router.py`) — only by the routes that are themselves commented
out there (`agent`, `alerts`, `audit`, `entities`, `responsible_ai`,
`str_drafts`, `transactions`, `transfers`, `webhooks`). Moved here rather
than deleted, in case any of it is useful reference later.

`app/services/name_verification_service.py` stayed in place — it's covered
by `tests/test_name_verification_service.py`.
