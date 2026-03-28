MERCK Spec

WAASL MERCK is a self-improving firewall-rule loop.
The repo keeps editable rules in waasl-rules.yaml.
It evaluates those rules against known malicious and known safe samples.
It mutates the rules when the ruleset misses a case.

Inputs
- attacks/known_malicious.json: malicious or suspicious samples with expected verdicts.
- safe_packages/known_good.json: safe samples with expected verdicts.
- waasl-rules.yaml: editable rule state.

Loop contract
- merck_loop.py reads the corpus and scores each sample as allow, warn, or block.
- It computes exact-match accuracy and a macro f1_score.
- It appends one JSON object per iteration to merck_results.jsonl.
- Each JSONL record includes iteration, accuracy, f1_score, mutation, and remaining mistakes.
- When the loop finds misses, it mutates waasl-rules.yaml conservatively and tries again.

Rule behaviors
- package_blocklist: exact package name/version blocks.
- reputation_thresholds: score cutoffs for warn and block.
- typosquatting.enabled: when true, block package names very close to known safe package names.
- behavioral_signals.block_if and behavioral_signals.warn_if: package-install signals that upgrade verdict severity.
- mcp_rules.block_if and mcp_rules.warn_if: MCP target classes or exact targets to block or warn on.
- domain_blocklist: API domains to block.

CLI
Run from the repo root: python3 merck_loop.py --iterations 5
The script updates waasl-rules.yaml in place and appends results to merck_results.jsonl.
