# WAASL MERCK Loop

This repo contains a self-improving firewall rule system.

## Files
- MERCK-SPEC.md — Full specification. READ THIS FIRST.
- waasl-rules.yaml — The ONLY file you can edit. Firewall rules.
- attacks/known_malicious.json — Test attacks. DO NOT EDIT.
- safe_packages/known_good.json — Safe packages. DO NOT EDIT.
- merck_loop.py — The loop runner (you build this).
- merck_results.jsonl — Results log (append only).

## Your job
Build merck_loop.py that implements the MERCK loop from MERCK-SPEC.md.
Then run it for the specified number of iterations.

## Stack
Python 3.12+. No external dependencies beyond PyYAML and standard lib.
