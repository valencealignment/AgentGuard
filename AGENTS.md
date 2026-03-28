# WAAL Lane Contract

## Purpose

WAAL is the product. WAAS Wall is the public watchboard surface. The repo is a
four-lane autonomous workspace designed for low-touch coordination.

## Lane Ownership

- `Computer 1` owns `apps/web/**` and `ops/*` files for the UI lane.
- `Computer 2` owns security research outputs, the MERCK loop, and security
  package artifacts.
- `Computer 3` owns shared contracts, repo-native coordination, hooks, the API,
  aggregate state, and integration reports.
- `Computer 4` owns the controlled sandbox demo lane and replay artifacts.

## Shared Rules

- Never ask the human for clarification during the autonomous run.
- Never move or rename another lane's core outputs to suit your lane.
- Use repo artifacts as the control plane.
- Emit only these message types in lane event files:
  - `CLAIM`
  - `STATUS`
  - `BLOCKER`
  - `HANDOFF`
  - `DONE`
- Emit heartbeats frequently enough for stale-lane detection.
- Never commit secrets, credentials, SSH config, or access details.

## Artifact Conventions

- Event files live under `ops/events/*.jsonl`.
- Lane status files live under `ops/status/*.json`.
- Aggregate state for the watchboard lives in:
  - `ops/watchboard-state.json`
  - `ops/status/aggregate.json`
  - `ops/kanban.json`
- Human-readable lane reports live under `ops/reports/**`.

## Integration Bias

- UI must degrade gracefully if the API is incomplete.
- Integration must adapt to the UI and security lanes, not the other way around.
- Demo outputs must be safe and controlled.

