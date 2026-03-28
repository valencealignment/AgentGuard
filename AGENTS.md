# WAAL / WAAS Wall Agent Notes

WAAL is the product. WAAS Wall is the public watchboard surface.

This repository now carries two realities at once:

- the original public dashboard line on `main`
- the fully integrated WAAL snapshot and artifact pipeline merged in from the
  autonomous lanes

The goal on integration branches is to keep the public Next.js dashboard
deployable while consuming the real repo artifacts produced by the MERCK,
security, integration, and demo lanes.

## Lane Ownership

- `Computer 1` owns the watchboard/UI lane.
- `Computer 2` owns MERCK, the policy engine, research generation, and package
  risk outputs.
- `Computer 3` owns shared contracts, hooks, aggregation, and integration.
- `Computer 4` owns the controlled sandbox demo lane.

## Shared Rules

- Never commit secrets, credentials, SSH config, or machine access details.
- Never rename or relocate another lane's core outputs just to suit your lane.
- Prefer adapting readers and adapters over rewriting primary artifact sources.
- Use repo artifacts under `ops/` as the integration plane.

## Core Artifact Locations

- Lane events: `ops/events/*.jsonl`
- Lane status: `ops/status/*.json`
- Aggregate watchboard state:
  - `ops/watchboard-state.json`
  - `ops/status/aggregate.json`
  - `ops/kanban.json`
- Security outputs:
  - `ops/reports/security/**`
  - `merck_results.jsonl`
  - `waasl-rules.yaml`
- Demo outputs:
  - `ops/reports/demo/**`

## MERCK Loop Files

These remain authoritative for the security lane and should not be casually
restructured:

- `MERCK-SPEC.md`
- `waasl-rules.yaml`
- `attacks/known_malicious.json`
- `safe_packages/known_good.json`
- `merck_loop.py`
- `merck_results.jsonl`

## Integration Bias

- The public dashboard should use real WAAL artifacts when available.
- Mock data should only be a fallback, not the primary source, on integrated
  branches.
- Keep the deploy path boring and reproducible.
