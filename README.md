# WAAL / WAAS Wall

WAAL is an agent supply chain firewall. WAAS Wall is the public watchboard
surface for the system.

This repo is organized for a four-lane autonomous hackathon run:

- `Computer 1`: watchboard UI
- `Computer 2`: security research / MERCK loop
- `Computer 3`: integration, shared contracts, hooks, API, aggregation
- `Computer 4`: controlled GCP sandbox demo

The repo is designed so each lane can work mostly independently while writing
machine-readable status and event artifacts under `ops/`.
