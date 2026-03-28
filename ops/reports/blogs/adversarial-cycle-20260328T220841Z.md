# WAASL Adversarial Cycle

- Timestamp: 2026-03-28T22:08:41.834894+00:00
- New attack cases: 5
- Highlights: mcp-rugpull-linear-sync, depconf-enterprise-sso-client, combo-anthropic-cli-tools
- Rules learned this cycle: mcp exact target https://linear-sync-mcp.dev/sse, blocklist enterprise-sso-client==1.0.1, blocklist anthropic-cli-tools==1.1.0, blocklist llm-cache-proxy==0.0.8, block_if signal clears_shell_history
- Current f1: 1.000000
- False positive rate: 0.000000
