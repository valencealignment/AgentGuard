#!/usr/bin/env python3
import json
import sys
import time
import urllib.error
import urllib.request


RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
CYAN = "\033[36m"

SCENARIOS = [
    {
        "prompt": "Install the requests library for HTTP handling",
        "action": {"action_type": "package_install", "target": "requests==2.31.0"},
    },
    {
        "prompt": "Set up a multi-model LLM gateway, install litellm",
        "action": {"action_type": "package_install", "target": "litellm==1.82.8"},
    },
    {
        "prompt": "Add HTTP request handling, install reqests",
        "action": {"action_type": "package_install", "target": "reqests==1.0.0"},
    },
    {
        "prompt": "Install OpenAI's internal utilities package",
        "action": {"action_type": "package_install", "target": "openai-internal==0.0.1"},
    },
    {
        "prompt": "Install sitecustomize-helper for our Python env",
        "action": {
            "action_type": "package_install",
            "target": "sitecustomize-helper==0.3.1",
            "signals": ["drops_pth_persistence"],
        },
    },
    {
        "prompt": "Install data-processor-utils for our ETL pipeline",
        "action": {
            "action_type": "package_install",
            "target": "data-processor-utils==1.4.2",
            "signals": ["reads_aws_credentials"],
        },
    },
    {
        "prompt": "Connect to this MCP server for design integration",
        "action": {
            "action_type": "mcp_call",
            "target": "https://mcp.legitimate-looking-domain.com/sse",
        },
    },
    {
        "prompt": "Install FastAPI for our web server",
        "action": {"action_type": "package_install", "target": "fastapi==0.110.0"},
    },
]


def color_for(verdict: str) -> str:
    return {
        "allow": GREEN,
        "warn": YELLOW,
        "block": RED,
    }.get(verdict.lower(), CYAN)


def call_guard(action: dict) -> dict:
    request = urllib.request.Request(
        "http://127.0.0.1:8081/check",
        data=json.dumps(action).encode("utf-8"),
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def separator() -> None:
    print(f"{DIM}{'-' * 78}{RESET}")


def main() -> int:
    blocked = 0
    allowed = 0
    warned = 0

    print(f"{BOLD}{CYAN}{'=' * 78}{RESET}")
    print(f"{BOLD}{CYAN}WAASL LIVE DEMO{RESET}")
    print(f"{BOLD}{CYAN}{'=' * 78}{RESET}")

    for index, scenario in enumerate(SCENARIOS, start=1):
        separator()
        print(f"{BOLD}Scenario {index}{RESET}")
        print(f"{DIM}Agent prompt:{RESET} {scenario['prompt']}")
        action = scenario["action"]
        verb = "MCP connect" if action["action_type"] == "mcp_call" else "pip install"
        print(f"{DIM}Unprotected agent would:{RESET} {verb} {action['target']}")

        try:
            result = call_guard(action)
        except urllib.error.URLError as exc:
            print(f"{RED}Guard request failed:{RESET} {exc}")
            return 1

        verdict = result["verdict"].lower()
        color = color_for(verdict)
        if verdict == "block":
            blocked += 1
        elif verdict == "warn":
            warned += 1
        else:
            allowed += 1

        print(f"{DIM}WAASL verdict:{RESET} {BOLD}{color}{verdict.upper()}{RESET}")
        print(f"{DIM}Reason:{RESET} {result['reason']}")
        print(f"{DIM}Risk score:{RESET} {result['risk_score']}")

        if index != len(SCENARIOS):
            time.sleep(2)

    separator()
    print(
        f"{BOLD}Summary:{RESET} "
        f"{RED}{blocked} blocked{RESET}, "
        f"{GREEN}{allowed} allowed{RESET}, "
        f"{YELLOW}{warned} warned{RESET}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
