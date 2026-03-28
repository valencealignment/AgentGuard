#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
ATTACKS_PATH = ROOT / "attacks" / "known_malicious.json"
SAFE_PATH = ROOT / "safe_packages" / "known_good.json"
RULES_PATH = ROOT / "waasl-rules.yaml"
RESULTS_PATH = ROOT / "merck_results.jsonl"
METRICS_JSON_PATH = ROOT / "ops" / "reports" / "security" / "metrics.json"
METRICS_MD_PATH = ROOT / "ops" / "reports" / "security" / "metrics.md"


DEFAULT_ATTACKS = json.loads(ATTACKS_PATH.read_text(encoding="utf-8"))
DEFAULT_SAFE = json.loads(SAFE_PATH.read_text(encoding="utf-8"))


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def read_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def write_json(path: Path, payload: Any) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def append_jsonl(path: Path, payload: dict[str, Any]) -> None:
    ensure_parent(path)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, sort_keys=True) + "\n")


def ensure_fixture(path: Path, payload: list[dict[str, Any]]) -> None:
    if not path.exists():
        write_json(path, payload)


def load_rules() -> dict[str, Any]:
    if not RULES_PATH.exists():
        raise FileNotFoundError(f"Missing rules file at {RULES_PATH}")
    return json.loads(RULES_PATH.read_text(encoding="utf-8"))


def save_rules(rules: dict[str, Any]) -> None:
    ensure_parent(RULES_PATH)
    RULES_PATH.write_text(json.dumps(rules, indent=2) + "\n", encoding="utf-8")


def version_blocked(rules: dict[str, Any], package: str, version: str) -> bool:
    blocked_versions = rules.get("blocked_packages", {}).get(package, [])
    return "*" in blocked_versions or version in blocked_versions


def score_case(case: dict[str, Any], rules: dict[str, Any]) -> tuple[str, int]:
    score = 0
    package = case.get("package", "")
    version = case.get("version", "")
    signals = case.get("signals", [])

    if version_blocked(rules, package, version):
        score += 92
    if package in rules.get("typosquats", []):
        score += 85
    if package in rules.get("malicious_mcp_servers", []):
        score += 90
    if case.get("origin") == "external" and case.get("reputation") == "poor":
        score += rules.get("origin_weights", {}).get("poor_external", 0)
    if case.get("transport") == "mcp" and case.get("tls") == "absent":
        score += rules.get("signal_weights", {}).get("no_tls", 0)

    for signal in signals:
        score += rules.get("signal_weights", {}).get(signal, 0)

    allow_max = rules.get("thresholds", {}).get("allow_max", 24)
    escalate_max = rules.get("thresholds", {}).get("escalate_max", 63)
    if score > escalate_max:
        return "BLOCK", score
    if score > allow_max:
        return "ESCALATE", score
    return "ALLOW", score


def compute_metrics(rules: dict[str, Any]) -> dict[str, Any]:
    attacks = read_json(ATTACKS_PATH, DEFAULT_ATTACKS)
    safe = read_json(SAFE_PATH, DEFAULT_SAFE)

    tp = tn = fp = fn = 0
    attack_results = []
    safe_results = []

    for case in attacks:
        verdict, score = score_case(case, rules)
        caught = verdict in {"BLOCK", "ESCALATE"}
        if caught:
            tp += 1
        else:
            fn += 1
        attack_results.append({
            "id": case["id"],
            "package": case["package"],
            "verdict": verdict,
            "score": score,
            "expected": case["expected"],
        })

    for case in safe:
        verdict, score = score_case(case, rules)
        safe_allow = verdict == "ALLOW"
        if safe_allow:
            tn += 1
        else:
            fp += 1
        safe_results.append({
            "id": case["id"],
            "package": case["package"],
            "verdict": verdict,
            "score": score,
            "expected": case["expected"],
        })

    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1_score = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    catch_rate = recall
    false_pos_rate = fp / (fp + tn) if (fp + tn) else 0.0

    return {
        "tp": tp,
        "tn": tn,
        "fp": fp,
        "fn": fn,
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1_score": round(f1_score, 3),
        "catch_rate": round(catch_rate, 3),
        "false_pos_rate": round(false_pos_rate, 3),
        "attack_results": attack_results,
        "safe_results": safe_results,
    }


def mutation_plan() -> list[tuple[str, str]]:
    return [
        ("version_range", "Block LiteLLM 1.82.7 alongside 1.82.8."),
        ("enable_typosquatting", "Add pandsa to the typosquat list."),
        ("new_category", "Add slopsquat model-helper packages to the blocked name set."),
        ("add_behavioral_signal", "Increase the writes_pth_file signal weight."),
        ("add_mcp_rule", "Require TLS for non-allowlisted MCP servers."),
    ]


def apply_mutation(rules: dict[str, Any], mutation_type: str) -> dict[str, Any]:
    updated = copy.deepcopy(rules)
    if mutation_type == "version_range":
        versions = updated.setdefault("blocked_packages", {}).setdefault("litellm", [])
        if "1.82.7" not in versions:
            versions.append("1.82.7")
    elif mutation_type == "enable_typosquatting":
        names = updated.setdefault("typosquats", [])
        if "pandsa" not in names:
            names.append("pandsa")
    elif mutation_type == "new_category":
        names = updated.setdefault("typosquats", [])
        for value in ("llm-utils", "ai-helper-toolkit"):
            if value not in names:
                names.append(value)
    elif mutation_type == "add_behavioral_signal":
        updated.setdefault("signal_weights", {})["writes_pth_file"] = max(
            updated.setdefault("signal_weights", {}).get("writes_pth_file", 0),
            36,
        )
    elif mutation_type == "add_mcp_rule":
        updated.setdefault("signal_weights", {})["no_tls"] = max(
            updated.setdefault("signal_weights", {}).get("no_tls", 0),
            24,
        )
        allowlist = updated.setdefault("mcp_allowlist", [])
        if "mcp.figma.com" not in allowlist:
            allowlist.append("mcp.figma.com")
        updated["rule_status"] = "self-improving"
    return updated


def write_metrics(iterations_run: int, kept: int, reverted: int, metrics: dict[str, Any], rules: dict[str, Any]) -> None:
    recent_results = []
    if RESULTS_PATH.exists():
        for line in RESULTS_PATH.read_text(encoding="utf-8").splitlines()[-10:]:
            if line.strip():
                recent_results.append(json.loads(line))

    payload = {
        "generated_at": iso_now(),
        "iterations_run": iterations_run,
        "kept_iterations": kept,
        "reverted_iterations": reverted,
        "rules_path": str(RULES_PATH.relative_to(ROOT)),
        "rule_status": rules.get("rule_status", "warming-up"),
        "metrics": metrics,
        "recent_results": recent_results,
        "merck_summary": f"MERCK F1 {metrics['f1_score']:.3f} with false-positive rate {metrics['false_pos_rate']:.3f}.",
    }
    write_json(METRICS_JSON_PATH, payload)

    lines = [
        "# MERCK Metrics",
        "",
        f"- Generated at: `{payload['generated_at']}`",
        f"- Iterations run: `{iterations_run}`",
        f"- Kept iterations: `{kept}`",
        f"- Reverted iterations: `{reverted}`",
        f"- Rule status: `{payload['rule_status']}`",
        "",
        "## Current metrics",
        f"- F1 score: `{metrics['f1_score']:.3f}`",
        f"- Catch rate: `{metrics['catch_rate']:.3f}`",
        f"- False-positive rate: `{metrics['false_pos_rate']:.3f}`",
        f"- Precision: `{metrics['precision']:.3f}`",
        f"- Recall: `{metrics['recall']:.3f}`",
        "",
    ]
    ensure_parent(METRICS_MD_PATH)
    METRICS_MD_PATH.write_text("\n".join(lines), encoding="utf-8")


def run_loop(iterations: int) -> dict[str, Any]:
    ensure_fixture(ATTACKS_PATH, DEFAULT_ATTACKS)
    ensure_fixture(SAFE_PATH, DEFAULT_SAFE)
    rules = load_rules()
    baseline = compute_metrics(rules)
    kept = 0
    reverted = 0

    plan = mutation_plan()
    for iteration in range(iterations):
        mutation_type, description = plan[iteration % len(plan)]
        candidate = apply_mutation(rules, mutation_type)
        candidate_metrics = compute_metrics(candidate)
        good = (
            candidate_metrics["f1_score"] >= baseline["f1_score"]
            and candidate_metrics["false_pos_rate"] < 0.05
        )
        if good:
            rules = candidate
            baseline = candidate_metrics
            kept += 1
            result = "kept"
        else:
            reverted += 1
            result = "reverted"

        append_jsonl(
            RESULTS_PATH,
            {
                "ts": iso_now(),
                "iteration": iteration + 1,
                "mutation": mutation_type,
                "description": description,
                "metrics": baseline if result == "kept" else candidate_metrics,
                "result": result,
            },
        )

    rules["rule_status"] = "self-improving"
    save_rules(rules)
    write_metrics(iterations, kept, reverted, baseline, rules)
    return baseline


def watch_loop(until_epoch: float | None, interval: int, iterations: int) -> None:
    while True:
        run_loop(iterations)
        if until_epoch is not None and time.time() >= until_epoch:
            break
        time.sleep(interval)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the WAAL MERCK self-improving loop.")
    parser.add_argument("--iterations", type=int, default=3, help="Number of mutations to attempt per cycle.")
    parser.add_argument("--watch", action="store_true", help="Keep re-running until the deadline.")
    parser.add_argument("--interval", type=int, default=60, help="Seconds between watch cycles.")
    parser.add_argument("--until-epoch", type=float, default=None, help="Optional unix epoch deadline.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.watch:
        watch_loop(args.until_epoch, args.interval, args.iterations)
        return
    run_loop(args.iterations)


if __name__ == "__main__":
    main()
