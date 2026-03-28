# WAAL Sandbox Demo Summary

- Generated at: `2026-03-28T12:54:09-07:00`
- Branch: `codex/demo-validation`

## Canonical Outcomes
- `scenario-a-clean-allow`: `ALLOW`
  - Trusted agent performing a benign read-only action inside the workspace.
  - Report: `ops/reports/demo/scenario-a-clean-allow/report.json`
  - Trace: `ops/reports/demo/scenario-a-clean-allow/trace.json`
- `scenario-b-litellm-risk`: `BLOCK`
  - Flagged dependency version and suspicious install-time signals require immediate blocking.
  - Report: `ops/reports/demo/scenario-b-litellm-risk/report.json`
  - Trace: `ops/reports/demo/scenario-b-litellm-risk/trace.json`
- `scenario-c-poor-reputation-external-agent`: `BLOCK`
  - External low-reputation agent lacks trusted provenance and requested unsafe side effects.
  - Report: `ops/reports/demo/scenario-c-poor-reputation-external-agent/report.json`
  - Trace: `ops/reports/demo/scenario-c-poor-reputation-external-agent/trace.json`
- `scenario-d-remediation-follow-through`: `ALLOW`
  - Generating remediation guidance is safe and needed after the blocked scenario.
  - Report: `ops/reports/demo/scenario-d-remediation-follow-through/report.json`
  - Trace: `ops/reports/demo/scenario-d-remediation-follow-through/trace.json`

## Judge Story
- Scenario A demonstrates a clean allow path for a trusted internal action.
- Scenario B blocks the flagged LiteLLM path with evidence suitable for the watchboard.
- Scenario C blocks a poor-reputation external agent and queues notifications.
- Scenario D shows remediation follow-through artifacts for downstream advisory work.
