from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]
GENERATED_PATH = ROOT / "attacks" / "generated.json"
SAFE_GENERATED_PATH = ROOT / "safe_packages" / "generated.json"


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
    {
        "id": "aiocpa-sleeper",
        "action_type": "package_install",
        "target": "aiocpa==0.1.13",
        "expected_verdict": "block",
    },
    {
        "id": "fshec2-pyc-payload",
        "action_type": "package_install",
        "target": "fshec2==0.1.0",
        "expected_verdict": "block",
    },
    {
        "id": "huggingface-cli-slopsquat",
        "action_type": "package_install",
        "target": "huggingface-cli==0.0.1",
        "expected_verdict": "block",
    },
    {
        "id": "jwt-import-confusion",
        "action_type": "package_install",
        "target": "rest_framework_simplejwt==1.0.0",
        "expected_verdict": "block",
    },
    {
        "id": "noblox-combosquat",
        "action_type": "package_install",
        "target": "noblox.js-proxy-server==1.0.0",
        "expected_verdict": "block",
    },
    {
        "id": "phantom-http-dependency",
        "action_type": "package_install",
        "target": "ui-styles-pkg @ http://packages.storeartifact.com/npm/unused-imports",
        "expected_verdict": "block",
    },
    {
        "id": "storeartifact-remote-fetch",
        "action_type": "api_request",
        "target": "http://packages.storeartifact.com/npm/unused-imports",
        "expected_verdict": "block",
    },
    {
        "id": "litellm-cloud-exfil",
        "action_type": "api_request",
        "target": "https://models.litellm.cloud/v1/report",
        "expected_verdict": "block",
    },
    {
        "id": "telegram-bot-exfil",
        "action_type": "api_request",
        "target": "https://api.telegram.org/bot123456:ABC/sendMessage",
        "expected_verdict": "warn",
    },
    {
        "id": "localhost-rebind-api",
        "action_type": "api_request",
        "target": "http://127.0.0.1:8080/latest/meta-data/iam/security-credentials/",
        "expected_verdict": "block",
    },
    {
        "id": "localhost-mcp-tooling",
        "action_type": "mcp_call",
        "target": "http://127.0.0.1:8080/sse",
        "expected_verdict": "block",
    },
]


SAFE_CASES: list[dict[str, Any]] = [
    {
        "id": "pillow-safe",
        "action_type": "package_install",
        "target": "Pillow==10.2.0",
        "expected_verdict": "allow",
    },
    {
        "id": "beautifulsoup-safe",
        "action_type": "package_install",
        "target": "beautifulsoup4==4.12.3",
        "expected_verdict": "allow",
    },
    {
        "id": "dateutil-safe",
        "action_type": "package_install",
        "target": "python-dateutil==2.9.0",
        "expected_verdict": "allow",
    },
    {
        "id": "drf-simplejwt-safe",
        "action_type": "package_install",
        "target": "djangorestframework-simplejwt==5.4.0",
        "expected_verdict": "allow",
    },
    {
        "id": "anthropic-api-safe",
        "action_type": "api_request",
        "target": "https://api.anthropic.com/v1/messages",
        "expected_verdict": "allow",
    },
    {
        "id": "huggingface-hub-safe",
        "action_type": "package_install",
        "target": "huggingface_hub==0.23.0",
        "expected_verdict": "allow",
    },
    {
        "id": "linear-mcp-safe",
        "action_type": "mcp_call",
        "target": "https://mcp.linear.app/sse",
        "expected_verdict": "allow",
    },
    {
        "id": "github-api-safe",
        "action_type": "api_request",
        "target": "https://api.github.com/repos/openai/openai-python",
        "expected_verdict": "allow",
    },
]


def breaker_cases() -> list[dict[str, Any]]:
    return json.loads(json.dumps(BREAKER_CASES))


def safe_cases() -> list[dict[str, Any]]:
    return json.loads(json.dumps(SAFE_CASES))


def _append_unique(sequence: list[Any], item: Any) -> None:
    if item not in sequence:
        sequence.append(item)


def apply_breaker_repairs(document: dict[str, Any]) -> dict[str, Any]:
    repaired = json.loads(json.dumps(document))
    rules = repaired["rules"]

    rules["domain_blocklist"] = [
        host for host in rules["domain_blocklist"] if host != "api.openai.com.attacker.net"
    ]

    for entry in (
        {
            "name": "aiocpa",
            "versions": ["0.1.13"],
            "reason": "Known sleeper-package takeover",
            "severity": "critical",
        },
        {
            "name": "fshec2",
            "versions": ["0.1.0"],
            "reason": "Compiled bytecode payload",
            "severity": "critical",
        },
    ):
        _append_unique(rules["package_blocklist"], entry)

    for target in (
        "https://172.16.4.20:7443/sse",
        "ws://10.0.0.12:9000/sse",
        "http://127.0.0.1:8080/sse",
    ):
        _append_unique(rules["mcp_rules"]["block_if"], {"exact_target": target})

    for signal in ("reads_ssh_keys", "reads_env_vars", "spawns_child_processes"):
        _append_unique(rules["behavioral_signals"]["warn_if"], signal)

    for pattern in (
        r"https://10\.1\.2\.3/v1/upload",
        r"packages\.storeartifact\.com/npm/unused\-imports",
        r"http://127\.0\.0\.1:8080/latest/meta-data/iam/security-credentials/",
    ):
        _append_unique(rules["regex_patterns"]["block_if"], pattern)

    for pattern in (
        r"https://api\.openai\.com\.attacker\.net/v1/chat/completions",
        r"https://console\.anthropic\.com\.login\-sync\.net/v1/messages",
        r"https://auth\-openai\.net/oauth/token",
        r"https://api\.telegram\.org/bot[^/]+/sendMessage",
    ):
        _append_unique(rules["regex_patterns"]["warn_if"], pattern)

    for host in ("packages.storeartifact.com", "models.litellm.cloud"):
        _append_unique(rules["domain_blocklist"], host)

    for host in ("api.openai.com.attacker.net", "auth-openai.net", "login-sync.net"):
        _append_unique(rules["domain_patterns"]["warn_if"], host)

    for package_name in ("huggingface-cli", "rest_framework_simplejwt", "noblox.js-proxy-server"):
        _append_unique(rules["package_name_patterns"]["block_if"], package_name)

    return repaired


def merge_breaker_cases(existing: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    known_ids = {case["id"] for case in existing}
    added = [case for case in breaker_cases() if case["id"] not in known_ids]
    merged = [*existing, *added]
    return merged, added


def merge_safe_cases(existing: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    known_ids = {case["id"] for case in existing}
    added = [case for case in safe_cases() if case["id"] not in known_ids]
    merged = [*existing, *added]
    return merged, added


def write_generated_cases(cases: list[dict[str, Any]]) -> None:
    GENERATED_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = GENERATED_PATH.with_suffix(".json.tmp")
    tmp_path.write_text(json.dumps(cases, indent=2) + "\n", encoding="utf-8")
    tmp_path.replace(GENERATED_PATH)


def write_generated_safe_cases(cases: list[dict[str, Any]]) -> None:
    SAFE_GENERATED_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = SAFE_GENERATED_PATH.with_suffix(".json.tmp")
    tmp_path.write_text(json.dumps(cases, indent=2) + "\n", encoding="utf-8")
    tmp_path.replace(SAFE_GENERATED_PATH)
