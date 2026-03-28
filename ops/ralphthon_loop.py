#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import merck_loop as merck


BLOGS_DIR = ROOT / "ops" / "reports" / "blogs"
SECURITY_DIR = ROOT / "ops" / "reports" / "security"
STATUS_LOG = ROOT / "ops" / "status" / "ralphthon.log"
ATTACKS_PATH = ROOT / "attacks" / "generated_adversarial.json"


CATEGORY_CASES: dict[str, list[dict[str, Any]]] = {
    "combosquatting": [
        {"id": "combo-requests-async", "action_type": "package_install", "target": "requests-async==0.1.0", "expected_verdict": "block"},
        {"id": "combo-numpy-cuda", "action_type": "package_install", "target": "numpy-cuda==1.26.0", "expected_verdict": "block"},
        {"id": "combo-flask-admin-tools", "action_type": "package_install", "target": "flask-admin-tools==2.0.0", "expected_verdict": "block"},
        {"id": "combo-pandas-stream", "action_type": "package_install", "target": "pandas-stream-utils==0.4.0", "expected_verdict": "block"},
        {"id": "combo-fastapi-auth-kit", "action_type": "package_install", "target": "fastapi-auth-kit==0.3.0", "expected_verdict": "block"},
        {"id": "combo-anthropic-cli-tools", "action_type": "package_install", "target": "anthropic-cli-tools==1.1.0", "expected_verdict": "block"},
        {"id": "combo-openai-agent-utils", "action_type": "package_install", "target": "openai-agent-utils==0.7.0", "expected_verdict": "block"},
    ],
    "slopsquatting": [
        {"id": "slop-jwt-secure-validator", "action_type": "package_install", "target": "jwt-secure-validator==0.1.0", "expected_verdict": "block"},
        {"id": "slop-fastapi-middleware-core", "action_type": "package_install", "target": "fastapi-middleware-core==0.2.1", "expected_verdict": "block"},
        {"id": "slop-openai-session-manager", "action_type": "package_install", "target": "openai-session-manager==0.0.3", "expected_verdict": "block"},
        {"id": "slop-redis-queue-secure", "action_type": "package_install", "target": "redis-queue-secure==0.0.2", "expected_verdict": "block"},
        {"id": "slop-vector-db-router", "action_type": "package_install", "target": "vector-db-router==0.1.4", "expected_verdict": "block"},
        {"id": "slop-llm-cache-proxy", "action_type": "package_install", "target": "llm-cache-proxy==0.0.8", "expected_verdict": "block"},
        {"id": "slop-async-token-refresh", "action_type": "package_install", "target": "async-token-refresh==0.0.5", "expected_verdict": "block"},
    ],
    "behavioral": [
        {"id": "signal-crontab-writer", "action_type": "package_install", "target": "cron-helper==1.0.0", "expected_verdict": "block", "signals": ["writes_crontab"]},
        {"id": "signal-bashrc-modifier", "action_type": "package_install", "target": "shell-profile-sync==0.6.0", "expected_verdict": "block", "signals": ["modifies_bashrc"]},
        {"id": "signal-path-injector", "action_type": "package_install", "target": "path-bootstrapper==2.2.0", "expected_verdict": "block", "signals": ["injects_path"]},
        {"id": "signal-browser-cookie-reader", "action_type": "package_install", "target": "browser-session-tools==1.3.0", "expected_verdict": "block", "signals": ["reads_browser_cookies"]},
        {"id": "signal-zshrc-modifier", "action_type": "package_install", "target": "shell-login-helper==1.4.0", "expected_verdict": "block", "signals": ["modifies_shell_rc"]},
        {"id": "signal-history-cleaner", "action_type": "package_install", "target": "session-cleaner==0.9.0", "expected_verdict": "block", "signals": ["clears_shell_history"]},
        {"id": "signal-ssh-config-reader", "action_type": "package_install", "target": "ssh-profile-tools==2.0.0", "expected_verdict": "block", "signals": ["reads_ssh_config"]},
    ],
    "mcp_rug_pull": [
        {"id": "mcp-rugpull-figma-helper", "action_type": "mcp_call", "target": "https://figma-helper-mcp.com/sse", "expected_verdict": "block", "signals": ["tool_description_changed"]},
        {"id": "mcp-rugpull-jira-bridge", "action_type": "mcp_call", "target": "https://jira-bridge-tools.dev/sse", "expected_verdict": "block", "signals": ["tool_description_changed"]},
        {"id": "mcp-rugpull-notion-sync", "action_type": "mcp_call", "target": "https://notion-sync-mcp.app/sse", "expected_verdict": "block", "signals": ["tool_description_changed"]},
        {"id": "mcp-rugpull-github-agent", "action_type": "mcp_call", "target": "https://github-agent-tools.app/sse", "expected_verdict": "block", "signals": ["tool_description_changed"]},
        {"id": "mcp-rugpull-linear-sync", "action_type": "mcp_call", "target": "https://linear-sync-mcp.dev/sse", "expected_verdict": "block", "signals": ["tool_description_changed"]},
        {"id": "mcp-rugpull-obsidian-bridge", "action_type": "mcp_call", "target": "https://obsidian-bridge-mcp.net/sse", "expected_verdict": "block", "signals": ["tool_description_changed"]},
    ],
    "dependency_confusion": [
        {"id": "depconf-company-auth", "action_type": "package_install", "target": "company-auth==0.9.1", "expected_verdict": "block"},
        {"id": "depconf-internal-api-client", "action_type": "package_install", "target": "internal-api-client==1.2.0", "expected_verdict": "block"},
        {"id": "depconf-corp-secrets-sdk", "action_type": "package_install", "target": "corp-secrets-sdk==0.0.4", "expected_verdict": "block"},
        {"id": "depconf-private-build-utils", "action_type": "package_install", "target": "private-build-utils==0.3.2", "expected_verdict": "block"},
        {"id": "depconf-enterprise-sso-client", "action_type": "package_install", "target": "enterprise-sso-client==1.0.1", "expected_verdict": "block"},
        {"id": "depconf-org-vault-sdk", "action_type": "package_install", "target": "org-vault-sdk==0.5.0", "expected_verdict": "block"},
    ],
    "pyc_hiding": [
        {"id": "pyc-hidden-loader", "action_type": "package_install", "target": "compiled-runtime-helper==0.5.0", "expected_verdict": "block", "signals": ["hides_in_pyc"]},
        {"id": "pyc-obfuscated-tools", "action_type": "package_install", "target": "bytecode-toolkit==1.1.1", "expected_verdict": "block", "signals": ["hides_in_pyc"]},
        {"id": "pyc-plugin-loader", "action_type": "package_install", "target": "plugin-runtime-cache==0.8.0", "expected_verdict": "block", "signals": ["hides_in_pyc"]},
        {"id": "pyc-shadow-package", "action_type": "package_install", "target": "runtime-shadow-tools==1.0.4", "expected_verdict": "block", "signals": ["hides_in_pyc"]},
        {"id": "pyc-wheel-loader", "action_type": "package_install", "target": "wheel-bootstrap-core==0.1.1", "expected_verdict": "block", "signals": ["hides_in_pyc"]},
    ],
    "steganography": [
        {"id": "stego-image-payload", "action_type": "package_install", "target": "theme-assets-plus==3.2.0", "expected_verdict": "block", "signals": ["downloads_stego_payload"]},
        {"id": "stego-png-fetcher", "action_type": "package_install", "target": "image-preview-assets==1.0.5", "expected_verdict": "block", "signals": ["downloads_stego_payload"]},
        {"id": "stego-icon-bundle", "action_type": "package_install", "target": "icon-bundle-cache==2.1.0", "expected_verdict": "block", "signals": ["downloads_stego_payload"]},
        {"id": "stego-splash-assets", "action_type": "package_install", "target": "splash-screen-assets==0.7.3", "expected_verdict": "block", "signals": ["downloads_stego_payload"]},
        {"id": "stego-ui-theme", "action_type": "package_install", "target": "ui-theme-pack==4.0.0", "expected_verdict": "block", "signals": ["downloads_stego_payload"]},
    ],
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def log_line(message: str) -> None:
    STATUS_LOG.parent.mkdir(parents=True, exist_ok=True)
    with STATUS_LOG.open("a", encoding="utf-8") as handle:
        handle.write(f"[{now_iso()}] {message}\n")
    print(message, flush=True)


def load_adversarial_cases() -> list[dict[str, Any]]:
    return merck.load_json(ATTACKS_PATH)


def save_adversarial_cases(cases: list[dict[str, Any]]) -> None:
    ATTACKS_PATH.write_text(json.dumps(cases, indent=2) + "\n", encoding="utf-8")


def case_exists(existing: list[dict[str, Any]], candidate: dict[str, Any]) -> bool:
    seen = {(item.get("id"), item.get("target")) for item in existing}
    return (candidate.get("id"), candidate.get("target")) in seen


def run_git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["git", *args], cwd=ROOT, text=True, capture_output=True, check=False)


def commit_if_needed(message: str, *paths: str) -> bool:
    run_git("add", *paths)
    if run_git("diff", "--cached", "--quiet").returncode == 0:
        return False
    result = run_git("commit", "-m", message)
    if result.returncode != 0:
        log_line(f"git commit failed: {result.stderr.strip()}")
        return False
    push = run_git("push", "origin", "main")
    if push.returncode != 0:
        log_line(f"git push failed: {push.stderr.strip()}")
    return True


def generate_batch(category_order: deque[str]) -> tuple[list[dict[str, Any]], list[str]]:
    rules = merck.load_rules()
    safe_package_names = {
        merck.parse_package_target(case["target"])[0]
        for case in merck.load_safe_corpus()
        if case["action_type"] == "package_install"
    }
    existing = load_adversarial_cases()
    batch: list[dict[str, Any]] = []
    categories_used: list[str] = []
    for _ in range(len(category_order)):
        category = category_order[0]
        candidates = CATEGORY_CASES[category]
        for candidate in candidates:
            if case_exists(existing, candidate) or case_exists(batch, candidate):
                continue
            predicted = merck.evaluate_sample(candidate, rules, safe_package_names)["verdict"]
            if predicted != candidate["expected_verdict"]:
                batch.append(candidate)
                categories_used.append(category)
                break
        category_order.rotate(-1)
        if len(batch) >= 5:
            break
    return batch[:5], categories_used[:5]


def recover_rules() -> tuple[list[str], dict[str, Any]]:
    attacks = merck.load_attack_corpus()
    safe_cases = merck.load_safe_corpus()
    rules = merck.load_rules()
    metrics = merck.evaluate_rules(rules, attacks, safe_cases)
    recent_categories: deque[str] = deque(maxlen=5)
    descriptions: list[str] = []
    no_improvement = 0
    iteration = 0
    while metrics["f1_score"] < 1.0:
        iteration += 1
        mutation = merck.choose_mutation(rules, metrics, attacks, safe_cases, no_improvement, recent_categories)
        candidate_rules = mutation.mutated_rules
        candidate_metrics = merck.evaluate_rules(candidate_rules, attacks, safe_cases)
        if merck.better_than(metrics, candidate_metrics):
            rules = candidate_rules
            merck.save_rules(rules)
            metrics = candidate_metrics
            recent_categories.append(mutation.category)
            descriptions.append(mutation.description)
            commit_if_needed(
                f"Ralphthon recover: {mutation.description}",
                "waasl-rules.yaml",
                "attacks/generated_adversarial.json",
            )
            no_improvement = 0
        else:
            no_improvement += 1
            recent_categories.append(mutation.category)
            if no_improvement > 12:
                break
    return descriptions, metrics


def update_artifacts(batch: list[dict[str, Any]], new_rules: list[str], metrics: dict[str, Any]) -> None:
    BLOGS_DIR.mkdir(parents=True, exist_ok=True)
    SECURITY_DIR.mkdir(parents=True, exist_ok=True)
    if batch:
        category_title = ", ".join(item["id"] for item in batch[:3])
        blog_path = BLOGS_DIR / f"adversarial-cycle-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.md"
        blog_path.write_text(
            "\n".join(
                [
                    "# WAASL Adversarial Cycle",
                    "",
                    f"- Timestamp: {now_iso()}",
                    f"- New attack cases: {len(batch)}",
                    f"- Highlights: {category_title}",
                    f"- Rules learned this cycle: {', '.join(new_rules) or 'none'}",
                    f"- Current f1: {metrics['f1_score']:.6f}",
                    f"- False positive rate: {metrics['false_pos_rate']:.6f}",
                ]
            )
            + "\n",
            encoding="utf-8",
        )
    security_path = SECURITY_DIR / "latest.md"
    security_path.write_text(
        "\n".join(
            [
                "# WAASL Detection Capabilities",
                "",
                f"- Updated: {now_iso()}",
                f"- Total attack corpus: {len(merck.load_attack_corpus())}",
                f"- Total safe corpus: {len(merck.load_safe_corpus())}",
                f"- f1 score: {metrics['f1_score']:.6f}",
                f"- Catch rate: {metrics['catch_rate']:.6f}",
                f"- False positive rate: {metrics['false_pos_rate']:.6f}",
                f"- Latest rule additions: {', '.join(new_rules) or 'none'}",
            ]
        )
        + "\n",
        encoding="utf-8",
    )


def total_commits() -> int:
    result = run_git("rev-list", "--count", "HEAD")
    return int(result.stdout.strip() or "0")


def time_remaining(until_epoch: int) -> str:
    remaining = max(0, until_epoch - int(time.time()))
    minutes, seconds = divmod(remaining, 60)
    return f"{minutes}m {seconds}s"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--until-epoch", type=int, required=True)
    parser.add_argument("--sleep-seconds", type=int, default=75)
    args = parser.parse_args()

    next_push = 0
    next_status = 0
    category_order: deque[str] = deque(CATEGORY_CASES.keys())

    while int(time.time()) < args.until_epoch:
        batch, categories = generate_batch(category_order)
        new_rules: list[str] = []
        if batch:
            cases = load_adversarial_cases()
            cases.extend(batch)
            save_adversarial_cases(cases)
            commit_if_needed(
                f"Ralphthon break: add {len(batch)} adversarial cases",
                "attacks/generated_adversarial.json",
            )

        metrics = merck.evaluate_rules(merck.load_rules(), merck.load_attack_corpus(), merck.load_safe_corpus())
        if metrics["f1_score"] < 1.0:
            new_rules, metrics = recover_rules()

        update_artifacts(batch, new_rules, metrics)

        now = int(time.time())
        if now >= next_push:
            commit_if_needed(
                "Ralphthon cycle artifacts",
                "attacks/generated_adversarial.json",
                "waasl-rules.yaml",
                "ops/reports/blogs",
                "ops/reports/security",
                "ops/status/ralphthon.log",
            )
            next_push = now + 300

        if now >= next_status:
            log_line(
                "status "
                f"remaining={time_remaining(args.until_epoch)} "
                f"attacks={len(merck.load_attack_corpus())} "
                f"safe={len(merck.load_safe_corpus())} "
                f"f1={metrics['f1_score']:.6f} "
                f"commits={total_commits()} "
                f"categories={','.join(categories) or 'none'} "
                f"new_rules={','.join(new_rules) or 'none'}"
            )
            next_status = now + 600

        time.sleep(args.sleep_seconds)

    final_metrics = merck.evaluate_rules(merck.load_rules(), merck.load_attack_corpus(), merck.load_safe_corpus())
    log_line(
        "complete "
        f"attacks={len(merck.load_attack_corpus())} "
        f"safe={len(merck.load_safe_corpus())} "
        f"f1={final_metrics['f1_score']:.6f}"
    )
    commit_if_needed(
        "Ralphthon final checkpoint",
        "attacks/generated_adversarial.json",
        "waasl-rules.yaml",
        "ops/reports/blogs",
        "ops/reports/security",
        "ops/status/ralphthon.log",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
