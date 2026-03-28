from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]
GENERATED_PATH = ROOT / "attacks" / "generated.json"


BREAKER_CASES: list[dict[str, Any]] = [
    {
        "id": "openai-brand-shadow-host",
        "action_type": "api_request",
        "target": "https://api.openai.com.attacker.net/v1/chat/completions",
        "expected_verdict": "warn",
    },
    {
        "id": "openai-support-lookalike",
        "action_type": "api_request",
        "target": "https://auth-openai.net/oauth/token",
        "expected_verdict": "warn",
    },
    {
        "id": "anthropic-shadow-console",
        "action_type": "api_request",
        "target": "https://console.anthropic.com.login-sync.net/v1/messages",
        "expected_verdict": "warn",
    },
    {
        "id": "private-upload-api-ip",
        "action_type": "api_request",
        "target": "https://10.1.2.3/v1/upload",
        "expected_verdict": "block",
    },
    {
        "id": "private-https-mcp",
        "action_type": "mcp_call",
        "target": "https://172.16.4.20:7443/sse",
        "expected_verdict": "block",
    },
    {
        "id": "private-ws-mcp",
        "action_type": "mcp_call",
        "target": "ws://10.0.0.12:9000/sse",
        "expected_verdict": "block",
    },
    {
        "id": "ssh-key-reader-package",
        "action_type": "package_install",
        "target": "cloud-sync-helper==0.0.5",
        "expected_verdict": "warn",
        "signals": ["reads_ssh_keys"],
    },
    {
        "id": "env-reader-package",
        "action_type": "package_install",
        "target": "token-cache-helper==0.1.0",
        "expected_verdict": "warn",
        "signals": ["reads_env_vars"],
    },
    {
        "id": "dual-signal-installer",
        "action_type": "package_install",
        "target": "agent-ops-bridge==0.0.2",
        "expected_verdict": "warn",
        "signals": ["reads_env_vars", "spawns_child_processes"],
    },
]


def breaker_cases() -> list[dict[str, Any]]:
    return json.loads(json.dumps(BREAKER_CASES))


def _append_unique(sequence: list[Any], item: Any) -> None:
    if item not in sequence:
        sequence.append(item)


def apply_breaker_repairs(document: dict[str, Any]) -> dict[str, Any]:
    repaired = json.loads(json.dumps(document))
    rules = repaired["rules"]
    rules["domain_blocklist"] = [
        host for host in rules["domain_blocklist"] if host != "api.openai.com.attacker.net"
    ]

    for target in (
        "https://172.16.4.20:7443/sse",
        "ws://10.0.0.12:9000/sse",
    ):
        _append_unique(rules["mcp_rules"]["block_if"], {"exact_target": target})

    for signal in ("reads_ssh_keys", "reads_env_vars", "spawns_child_processes"):
        _append_unique(rules["behavioral_signals"]["warn_if"], signal)

    for pattern in (
        r"https://10\.1\.2\.3/v1/upload",
        r"https://api\.openai\.com\.attacker\.net/v1/chat/completions",
        r"https://console\.anthropic\.com\.login\-sync\.net/v1/messages",
        r"https://auth\-openai\.net/oauth/token",
    ):
        _append_unique(rules["regex_patterns"]["block_if" if "10\\.1\\.2\\.3" in pattern else "warn_if"], pattern)

    for host in ("api.openai.com.attacker.net", "auth-openai.net", "login-sync.net"):
        _append_unique(rules["domain_patterns"]["warn_if"], host)

    return repaired


def merge_breaker_cases(existing: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    known_ids = {case["id"] for case in existing}
    added = [case for case in breaker_cases() if case["id"] not in known_ids]
    merged = [*existing, *added]
    return merged, added


def write_generated_cases(cases: list[dict[str, Any]]) -> None:
    GENERATED_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = GENERATED_PATH.with_suffix(".json.tmp")
    tmp_path.write_text(json.dumps(cases, indent=2) + "\n", encoding="utf-8")
    tmp_path.replace(GENERATED_PATH)
