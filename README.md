# WAAL / WAAS Wall

WAAL is an agent supply chain firewall. WAAS Wall is the public watchboard
surface for the system.

Public links:

- Repository: `https://github.com/valencealignment/AgentGuard`
- Static demo snapshot: `https://waal-demo-site.vercel.app`

Important branch note:

- `main` is the public collaboration branch and contains ongoing dashboard work.
- `codex/public-demo-integration` is the off-`main` integration branch that
  keeps the Next.js dashboard while wiring it to the merged WAAL artifact set.
- `codex/mail-core` is the canonical integrated hackathon snapshot that ties the
  four lanes together and is the safest branch to use if you want to reproduce
  the exact end-of-run WAAL demo described below.

This repo was organized for a four-lane autonomous hackathon run:

- `Computer 1`: watchboard UI
- `Computer 2`: security research / MERCK loop
- `Computer 3`: integration, shared contracts, hooks, API, aggregation
- `Computer 4`: controlled GCP sandbox demo

The repo is designed so each lane can work mostly independently while writing
machine-readable status and event artifacts under `ops/`.

## Where It Landed

The complete end-of-run WAAL snapshot includes:

- a watchboard UI
- a local API that serves the watchboard and repo artifacts
- deterministic demo scenarios for `ALLOW`, `BLOCK`, and `ESCALATE`
- a MERCK self-improving package-risk loop
- security research artifacts, advisories, and patch proposals
- lane heartbeats, status files, and aggregate watchboard state under `ops/`

The integrated snapshot is already materialized in the repo on
`codex/mail-core`, and `codex/public-demo-integration` layers that artifact set
under the deployable Next.js dashboard from `main`:

- [apps/api/server.js](/Users/sarahhatcher/Documents/AgentGuard/apps/api/server.js)
- [apps/web/app.js](/Users/sarahhatcher/Documents/AgentGuard/apps/web/app.js)
- [packages/policy-engine/index.js](/Users/sarahhatcher/Documents/AgentGuard/packages/policy-engine/index.js)
- [packages/research-engine/index.js](/Users/sarahhatcher/Documents/AgentGuard/packages/research-engine/index.js)
- [merck_loop.py](/Users/sarahhatcher/Documents/AgentGuard/merck_loop.py)
- [services/security-research/run_security_lane.js](/Users/sarahhatcher/Documents/AgentGuard/services/security-research/run_security_lane.js)
- [ops/watchboard-state.json](/Users/sarahhatcher/Documents/AgentGuard/ops/watchboard-state.json)
- [ops/status/aggregate.json](/Users/sarahhatcher/Documents/AgentGuard/ops/status/aggregate.json)

## Run From Any Computer

If you want the exact integrated hackathon demo on any machine, use
`codex/mail-core`.

Requirements:

- Node.js 22+
- Python 3.11+
- Git

Steps:

1. `git clone https://github.com/valencealignment/AgentGuard.git`
2. `cd AgentGuard`
3. `git checkout codex/mail-core`
4. `node apps/api/server.js`
5. Open `http://127.0.0.1:8787`

That is enough to view the integrated watchboard using the checked-in final
artifacts.

If you want to regenerate the final repo artifacts locally before opening the
UI, run these in order:

1. `python3 merck_loop.py --iterations 4`
2. `node services/security-research/run_security_lane.js --emit-claim`
3. `python3 services/demo-validation/scenario_runner.py --emit-claim`
4. `python3 scripts/ops/aggregate_state.py`
5. `node apps/api/server.js`

If you want the deployable off-`main` dashboard that uses the merged artifact
set from every lane, use `codex/public-demo-integration` instead:

1. `git clone https://github.com/valencealignment/AgentGuard.git`
2. `cd AgentGuard`
3. `git checkout codex/public-demo-integration`
4. `npm install`
5. `npm run build`
6. `npm run start`
7. Open `http://127.0.0.1:3000/dashboard`

That branch keeps the public dashboard app, but the `/api/*` routes are fed by
the integrated WAAL outputs under `ops/` rather than the original mock-only
feeds.

## Demo Narrative

The intended judge-facing flow is:

1. Safe internal action is allowed.
2. LiteLLM-centered risky dependency path is blocked.
3. Poor-reputation external agent is blocked.
4. Human approval is requested for advisory publication.
5. A LiteLLM advisory and patch proposal are already present in `ops/reports/`.

The most important generated outputs are:

- `ops/reports/security/metrics.json`
- `ops/reports/security/latest-run.json`
- `ops/reports/security/litellm-remediation-brief.md`
- `ops/reports/blogs/litellm-advisory.md`
- `ops/reports/demo/latest-run.json`
- `ops/watchboard-state.json`

## Operational Notes

- The Vercel demo URL is a static snapshot of the integrated branch, not a live
  mutable backend.
- The local API path is the authoritative way to run the full integrated wall.
- The off-`main` integration branch is the deployable bridge between the public
  dashboard code and the full WAAL artifact pipeline.
- If you only need the public artifact for judges, use the Vercel link.
- If you need the reproducible local demo, use `codex/mail-core`.
