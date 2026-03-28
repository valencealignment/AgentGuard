# GCP Sandbox Notes

This lane uses a deterministic local fallback first.

If a GCP deployment is needed later, reuse the same scenario schema and outputs from:

- `packages/demo-scenarios/canonical_scenarios.json`
- `ops/events/demo.jsonl`
- `ops/status/demo.json`
- `ops/reports/demo/latest-run.json`

The local runner is intentionally safe:

- no malware
- no offensive actions
- only deterministic fixtures, evidence, and policy outcomes
