# LiteLLM Supply-Chain Advisory

Date: 2026-03-28

## Summary

The WAASL MERCK corpus treats `litellm==1.82.7` and `litellm==1.82.8` as
malicious package-install events. In this scenario, the installer behavior is
high risk because it combines credential access with execution behavior that is
not required for a normal dependency install.

## Observed Behaviors

- Reads SSH keys during install.
- Reads environment variables during install.
- Spawns child processes during install.

Those signals are strong supply-chain indicators because they create a direct
path from package install to credential theft, environment discovery, and
follow-on execution.

## Operational Impact

- Developer workstations can leak SSH material or API secrets.
- CI runners can expose environment-scoped credentials.
- A compromised dependency can pivot into internal services by reusing the
  captured secrets during the same install window.

## Current WAASL Response

- Blocks exact bad versions of LiteLLM in `waasl-rules.yaml`.
- Keeps `litellm==1.82.6` allowed to avoid over-blocking known safe installs.
- Adds a generated regression test for `litellm==1.82.9` with an expected
  `warn` verdict so adjacent versions are reviewed before promotion.

## Recommended Actions

- Freeze dependency resolution and pin to known-safe versions.
- Rotate any credentials exposed on hosts that installed the affected versions.
- Review build logs for package-install network activity and child-process
  execution.
- Require package provenance review before approving adjacent LiteLLM releases.

## Detection Notes

The current MERCK policy is tuned to preserve `f1 >= 0.98` while pushing false
positives toward `0.0`. That means exact malicious versions stay blocked, known
safe versions stay allowed, and newly suspicious neighboring versions are
surfaced as warnings until confirmed.
