#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import importlib.util
import json
import subprocess
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
STATUS_PATH = ROOT / "ops" / "status" / "autoresearch-supervisor.json"
REPORT_PATH = ROOT / "ops" / "reports" / "integration" / "latest.md"
DOC_PATH = ROOT / "docs" / "autoresearch-vast.md"

REMOTE_HOST = "root@ssh3.vast.ai"
REMOTE_PORT = "15286"
SSH_KEY = str(Path.home() / ".ssh" / "id_ed25519")
REMOTE_UV = "/root/.local/bin/uv"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(f"{path.suffix}.tmp")
    tmp_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    tmp_path.replace(path)


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(f"{path.suffix}.tmp")
    tmp_path.write_text(content, encoding="utf-8")
    tmp_path.replace(path)


def load_merck_module():
    spec = importlib.util.spec_from_file_location("merck_runtime", ROOT / "merck_loop.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def load_breaker_module():
    spec = importlib.util.spec_from_file_location(
        "research_breaker",
        ROOT / "packages" / "research-engine" / "research_engine" / "breaker.py",
    )
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def load_generated_cases() -> list[dict[str, Any]]:
    path = ROOT / "attacks" / "generated.json"
    if not path.exists():
        return []
    return json.loads(path.read_text())


def load_generated_safe_cases() -> list[dict[str, Any]]:
    path = ROOT / "safe_packages" / "generated.json"
    if not path.exists():
        return []
    return json.loads(path.read_text())


def breaker_cycle(min_f1: float) -> dict[str, Any]:
    merck = load_merck_module()
    breaker = load_breaker_module()
    generated = load_generated_cases()
    merged, added = breaker.merge_breaker_cases(generated)
    if added:
        breaker.write_generated_cases(merged)

    safe_cases = merck.load_json(merck.SAFE_PATH)
    generated_safe = load_generated_safe_cases()
    merged_safe, added_safe = breaker.merge_safe_cases(generated_safe)
    if added_safe:
        breaker.write_generated_safe_cases(merged_safe)
        generated_safe = merged_safe
    safe_cases.extend(generated_safe)
    attacks = merck.load_attack_corpus()
    current_rules = breaker.apply_breaker_repairs(merck.load_rules())
    merck.save_rules(current_rules)
    metrics = merck.evaluate_rules(current_rules, attacks, safe_cases)

    no_improvement_streak = 0
    recent_categories: deque[str] = deque(maxlen=3)
    kept_mutations: list[str] = []
    reverted_mutations: list[str] = []

    for _ in range(24):
        if metrics["f1_score"] >= min_f1 and not metrics["remaining_mistakes"]:
            break
        mutation = merck.choose_mutation(
            current_rules,
            metrics,
            attacks,
            safe_cases,
            no_improvement_streak,
            recent_categories,
        )
        merck.save_rules(mutation.mutated_rules)
        candidate_rules = merck.load_rules()
        candidate_metrics = merck.evaluate_rules(candidate_rules, attacks, safe_cases)
        improved = (
            candidate_metrics["f1_score"] > metrics["f1_score"]
            or (
                candidate_metrics["f1_score"] == metrics["f1_score"]
                and candidate_metrics["false_pos_rate"] <= metrics["false_pos_rate"]
                and len(candidate_metrics["remaining_mistakes"]) < len(metrics["remaining_mistakes"])
            )
        )
        safe_to_keep = (
            candidate_metrics["f1_score"] >= min_f1
            and candidate_metrics["false_pos_rate"] <= 0.05
        )
        if improved and safe_to_keep:
            current_rules = candidate_rules
            metrics = candidate_metrics
            recent_categories.append(mutation.category)
            kept_mutations.append(mutation.description)
            no_improvement_streak = 0
        else:
            merck.save_rules(current_rules)
            reverted_mutations.append(mutation.description)
            no_improvement_streak += 1

    final_metrics = merck.evaluate_rules(current_rules, merck.load_attack_corpus(), safe_cases)
    write_json(
        STATUS_PATH,
        {
            "ts": now_iso(),
            "lane": "breaker",
            "new_cases_added": [case["id"] for case in added],
            "new_safe_cases_added": [case["id"] for case in added_safe],
            "kept_mutations": kept_mutations,
            "reverted_mutations": reverted_mutations,
            "attack_count": len(merck.load_attack_corpus()),
            "safe_count": len(safe_cases),
            "f1_score": final_metrics["f1_score"],
            "false_pos_rate": final_metrics["false_pos_rate"],
            "remaining_mistakes": [item["id"] for item in final_metrics["remaining_mistakes"]],
        },
    )
    return {
        "added": added,
        "added_safe": added_safe,
        "metrics": final_metrics,
        "kept_mutations": kept_mutations,
        "reverted_mutations": reverted_mutations,
    }


def ssh(command: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            "ssh",
            "-i",
            SSH_KEY,
            "-o",
            "IdentitiesOnly=yes",
            "-o",
            "StrictHostKeyChecking=no",
            "-p",
            REMOTE_PORT,
            REMOTE_HOST,
            command,
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


def autoresearch_cycle() -> dict[str, Any]:
    probe = ssh(
        "cd /root/autoresearch && "
        "printf '===RUN===\\n' && date -u && "
        "printf '===BASELINE===\\n' && (test -f baseline.log && tail -n 40 baseline.log || true) && "
        "printf '===TRAIN===\\n' && "
        "(ps -eo pid,cmd | grep -E '/root/.local/bin/uv run train.py|/root/autoresearch/.venv/bin/python3 train.py' | grep -v grep || true) && "
        "printf '===RESULTS===\\n' && (tail -n 5 results.tsv || true)"
    )
    stdout = probe.stdout
    python_h_missing = "Python.h" in stdout
    kernel_mismatch = "no kernel image is available for execution on the device" in stdout
    oom = "OutOfMemoryError" in stdout
    running = "step 000" in stdout or "/root/autoresearch/.venv/bin/python3 train.py" in stdout

    recovery_actions: list[str] = []
    if python_h_missing:
        install = ssh(
            "export DEBIAN_FRONTEND=noninteractive && "
            "apt-get update && "
            "apt-get install -y python3.10-dev build-essential"
        )
        recovery_actions.append(f"installed_headers:{install.returncode}")

    if not running:
        restart = ssh(
            "cd /root/autoresearch && "
            f"nohup bash -lc '{REMOTE_UV} run train.py > baseline.log 2>&1' >/dev/null 2>&1 & "
            "echo $! > baseline.pid && "
            "cat baseline.pid"
        )
        recovery_actions.append(f"restarted_train:{restart.returncode}")
    else:
        recovery_actions.append("training_running")

    verify = ssh(
        "cd /root/autoresearch && "
        "printf '===RUN===\\n' && date -u && "
        "printf '===BASELINE===\\n' && (test -f baseline.log && tail -n 40 baseline.log || true) && "
        "printf '===TRAIN===\\n' && "
        "(ps -eo pid,cmd | grep -E '/root/.local/bin/uv run train.py|/root/autoresearch/.venv/bin/python3 train.py' | grep -v grep || true) && "
        "printf '===RESULTS===\\n' && (tail -n 5 results.tsv || true)"
    )
    verify_text = verify.stdout.replace("\x00", "").strip()
    verify_excerpt = verify_text.splitlines()[-40:]

    if python_h_missing:
        last_result = "train.py failed: missing Python.h for Triton build"
    elif kernel_mismatch:
        last_result = "train.py failed: flash-attn kernel image unavailable on 5090"
    elif oom:
        last_result = "train.py failed: CUDA out of memory on fallback path"
    elif running:
        last_result = "train.py running"
    else:
        last_result = "train.py not running"

    doc_lines = [
        "# Vast Autoresearch Run",
        "",
        "## Current Instance",
        "",
        "- Status: running on Vast proxy SSH",
        "- GPU target: RTX 5090",
        "- Instance id: `33735286`",
        "- SSH: `ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes -p 15286 root@ssh3.vast.ai`",
        "",
        "## Current State",
        "",
        f"- Refreshed: {now_iso()}",
        f"- Last result: {last_result}",
        f"- Recovery actions: {', '.join(recovery_actions) if recovery_actions else 'none'}",
        "",
        "```text",
        "\n".join(verify_excerpt) or "(no output)",
        "```",
        "",
        "## Sync Policy",
        "",
        "- Keep MERCK services stable first.",
        "- Keep the remote training lane alive and recover from environment drift.",
        "- Push meaningful checkpoints to `main`.",
    ]
    write_text(DOC_PATH, "\n".join(doc_lines) + "\n")

    return {
        "probe_returncode": probe.returncode,
        "last_result": last_result,
        "recovery_actions": recovery_actions,
        "status_excerpt": verify_excerpt[-12:],
    }


def write_report(local_result: dict[str, Any], remote_result: dict[str, Any]) -> None:
    metrics = local_result["metrics"]
    lines = [
        "# Integration Status",
        "",
        f"- Refreshed: {now_iso()}",
        f"- Attack corpus: {len(load_merck_module().load_attack_corpus())} attacks",
        f"- Safe corpus: {len(load_merck_module().load_json(load_merck_module().SAFE_PATH)) + len(load_generated_safe_cases())} cases",
        f"- F1 score: {metrics['f1_score']:.3f}",
        f"- False positive rate: {metrics['false_pos_rate']:.3f}",
        f"- New breaker cases this cycle: {', '.join(case['id'] for case in local_result['added']) or 'none'}",
        f"- New safe cases this cycle: {', '.join(case['id'] for case in local_result['added_safe']) or 'none'}",
        f"- Kept mutations: {', '.join(local_result['kept_mutations']) or 'none'}",
        f"- Last autoresearch result: {remote_result['last_result']}",
        f"- Remote recovery actions: {', '.join(remote_result['recovery_actions']) or 'none'}",
        "",
        "## Remote status excerpt",
        "",
        "```text",
        "\n".join(remote_result["status_excerpt"]) or "(no remote output)",
        "```",
    ]
    write_text(REPORT_PATH, "\n".join(lines) + "\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the local breaker and remote autoresearch supervisor.")
    parser.add_argument("--until-epoch", type=float, default=0.0)
    parser.add_argument("--interval-seconds", type=int, default=60)
    parser.add_argument("--min-f1", type=float, default=0.98)
    parser.add_argument("--once", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    while True:
        local_result = breaker_cycle(args.min_f1)
        remote_result = autoresearch_cycle()
        write_report(local_result, remote_result)
        if args.once:
            return
        if args.until_epoch and time.time() >= args.until_epoch:
            return
        time.sleep(args.interval_seconds)


if __name__ == "__main__":
    main()
