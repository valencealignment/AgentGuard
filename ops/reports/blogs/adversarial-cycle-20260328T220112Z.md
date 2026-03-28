# WAASL Adversarial Cycle

- Timestamp: 2026-03-28T22:01:12.409479+00:00
- New attack cases: 5
- Highlights: combo-requests-async, slop-jwt-secure-validator, signal-crontab-writer
- Rules learned this cycle: blocklist requests-async==0.1.0, blocklist jwt-secure-validator==0.1.0, block_if signal writes_crontab, mcp exact target https://figma-helper-mcp.com/sse, blocklist company-auth==0.9.1
- Current f1: 1.000000
- False positive rate: 0.000000
