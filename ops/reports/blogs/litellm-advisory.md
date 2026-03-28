# LiteLLM supply-chain advisory

## What happened
litellm 1.82.8 is on the blocked package-version list. Evidence: flagged_dependency_version, reads_env_vars, reads_ssh_keys, opens_network_socket_during_install, network_required.

## Why WAAL reacted
litellm 1.82.8 is on the blocked package-version list.

## Recommended remediation
- Pin LiteLLM to `<=1.82.6` until the flagged installer path is cleared.
- Delete suspicious `.pth` startup hooks from the environment before rebuilding it.
- Rotate any credentials exposed during the attempted install path.
- Rebuild the virtual environment from a known-good lockfile and re-run receipt validation.

## Current MERCK posture
- Latest F1: 1
- False-positive rate: 0

