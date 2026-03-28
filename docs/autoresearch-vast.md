# Vast Autoresearch Run

## Purpose

Track the remote Vast-backed `autoresearch` run for self-improving detection work.

## Current Plan

- Provision a single-GPU Vast instance with enough VRAM for `autoresearch`.
- Bootstrap the upstream `karpathy/autoresearch` repo on the remote host.
- Create a detection-focused research branch and baseline run.
- Pull back status snapshots and keep this repo updated on `main`.

## Current Instance

- Status: provisioning complete, bootstrap pending container readiness
- Provider: Vast.ai
- GPU target: RTX 4090
- Instance label: `autoresearch-detection`

## Sync Policy

- Keep MERCK services stable first.
- Push meaningful setup and run-status checkpoints to `main`.
- Avoid committing ephemeral logs or secrets.
