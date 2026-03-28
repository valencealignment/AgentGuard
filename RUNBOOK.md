# WAAL Runbook

## Canonical Demo Branch

Use `codex/mail-core` if you need the exact integrated hackathon snapshot.

Why:

- it contains the integrated UI
- it contains the API server
- it contains the security lane
- it contains the demo lane
- it contains the final `ops/` artifact set used by the watchboard

`main` is public and active, but it should be treated as ongoing collaboration
work, not the guaranteed end-of-run snapshot.

## Fastest Demo Path

On any machine with Node and Python installed:

1. `git clone https://github.com/valencealignment/AgentGuard.git`
2. `cd AgentGuard`
3. `git checkout codex/mail-core`
4. `node apps/api/server.js`
5. Open `http://127.0.0.1:8787`

This works because the final watchboard data is already committed under `ops/`.

## Full Regeneration Path

If you want to rebuild the final artifacts before starting the API:

1. `python3 merck_loop.py --iterations 4`
2. `node services/security-research/run_security_lane.js --emit-claim`
3. `python3 services/demo-validation/scenario_runner.py --emit-claim`
4. `python3 scripts/ops/aggregate_state.py`
5. `node apps/api/server.js`

## Public Links

- Repository: `https://github.com/valencealignment/AgentGuard`
- Demo: `https://waal-demo-site.vercel.app`

## Expected Demo Outcomes

- Safe internal action: `ALLOW`
- LiteLLM-centered risky action: `BLOCK`
- Poor-reputation external agent: `BLOCK`
- Advisory publication: `ESCALATE`

## Important Files

- `apps/api/server.js`: local API server
- `apps/web/index.html`: watchboard shell
- `apps/web/app.js`: watchboard data hydration and rendering
- `packages/policy-engine/index.js`: deterministic policy logic
- `packages/research-engine/index.js`: advisory and remediation generation
- `merck_loop.py`: self-improving scoring loop
- `services/security-research/run_security_lane.js`: security lane runner
- `services/demo-validation/scenario_runner.py`: deterministic demo runner
- `ops/watchboard-state.json`: integrated watchboard snapshot
- `ops/status/aggregate.json`: aggregate lane state

## Public Repo Notes

- Do not commit credentials, SSH config, or machine-access details.
- Prefer comments that explain intent, safety assumptions, and demo behavior.
- Treat `ops/` as generated evidence for the wall, not as hidden internal state.
