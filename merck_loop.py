#!/usr/bin/env python3
import argparse
import copy
import difflib
import ipaddress
import json
import math
import os
import random
import re
import subprocess
import threading
import time
from collections import Counter, deque
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import yaml

try:
    from fastapi import FastAPI
    import uvicorn
except ImportError as exc:  # pragma: no cover - handled at runtime
    raise SystemExit(
        "fastapi and uvicorn are required for the teammate API. "
        "Install them first, ideally in a virtual environment."
    ) from exc


ROOT = Path(__file__).resolve().parent
RULES_PATH = ROOT / "waasl-rules.yaml"
ATTACKS_PATH = ROOT / "attacks" / "known_malicious.json"
GENERATED_ATTACKS_PATH = ROOT / "attacks" / "generated.json"
GENERATED_ADVERSARIAL_ATTACKS_PATH = ROOT / "attacks" / "generated_adversarial.json"
SAFE_PATH = ROOT / "safe_packages" / "known_good.json"
GENERATED_SAFE_PATH = ROOT / "safe_packages" / "generated.json"
RESULTS_PATH = ROOT / "merck_results.jsonl"
LIVE_VERDICTS_PATH = ROOT / "ops" / "events" / "live_verdicts.jsonl"
SECURITY_STATUS_PATH = ROOT / "ops" / "status" / "security.json"
DEFAULT_PROGRESS_SECONDS = 30 * 60
DEFAULT_STATUS_SECONDS = 60
VERDICTS = ("allow", "warn", "block")


@dataclass
class Mutation:
    category: str
    description: str
    mutated_rules: dict[str, Any]


class SharedState:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.metrics: dict[str, Any] = {}
        self.iteration = 0
        self.best_f1 = 0.0
        self.rules_added = 0
        self.rules_reverted = 0
        self.category_counts: Counter[str] = Counter()
        self.started_at = datetime.now(timezone.utc).isoformat()
        self.pid = os.getpid()
        self.port = 0
        self.latest_record: dict[str, Any] = {}
        self.corpus_counts = {"attacks": 0, "safe_cases": 0}


def load_json(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return json.loads(path.read_text())


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(f"{path.suffix}.tmp")
    tmp_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    tmp_path.replace(path)


def ensure_runtime_paths() -> None:
    GENERATED_ATTACKS_PATH.parent.mkdir(parents=True, exist_ok=True)
    GENERATED_ADVERSARIAL_ATTACKS_PATH.parent.mkdir(parents=True, exist_ok=True)
    GENERATED_SAFE_PATH.parent.mkdir(parents=True, exist_ok=True)
    SECURITY_STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    (ROOT / "ops" / "reports" / "blogs").mkdir(parents=True, exist_ok=True)


def load_attack_corpus() -> list[dict[str, Any]]:
    dynamic = load_json(GENERATED_ADVERSARIAL_ATTACKS_PATH)
    return [
        *load_json(ATTACKS_PATH),
        *load_json(GENERATED_ATTACKS_PATH),
        *[sample for sample in dynamic if sample.get("expected_verdict") != "allow"],
    ]


def load_safe_corpus() -> list[dict[str, Any]]:
    dynamic = load_json(GENERATED_ADVERSARIAL_ATTACKS_PATH)
    return [
        *load_json(SAFE_PATH),
        *load_json(GENERATED_SAFE_PATH),
        *[sample for sample in dynamic if sample.get("expected_verdict") == "allow"],
    ]


def default_rules_document() -> dict[str, Any]:
    return {
        "version": 1,
        "rules": {
            "package_blocklist": [],
            "reputation_thresholds": {
                "block_below_score": 10,
                "warn_below_score": 30,
            },
            "typosquatting": {"enabled": False},
            "behavioral_signals": {"block_if": [], "warn_if": []},
            "mcp_rules": {"block_if": [], "warn_if": []},
            "domain_blocklist": [],
            "domain_patterns": {"block_if": [], "warn_if": []},
            "regex_patterns": {"block_if": [], "warn_if": []},
            "package_name_patterns": {"block_if": [], "warn_if": []},
            "host_suffix_patterns": {"block_if": []},
        },
    }


def ensure_rules_shape(document: dict[str, Any]) -> dict[str, Any]:
    merged = default_rules_document()
    merged["version"] = document.get("version", 1)
    rules = merged["rules"]
    current = document.get("rules", {})
    for key, value in current.items():
        if isinstance(value, dict) and isinstance(rules.get(key), dict):
            rules[key].update(value)
        else:
            rules[key] = value
    return merged


def load_rules() -> dict[str, Any]:
    return ensure_rules_shape(yaml.safe_load(RULES_PATH.read_text()) or {})


def save_rules(document: dict[str, Any]) -> None:
    RULES_PATH.write_text(yaml.safe_dump(document, sort_keys=False))


def parse_package_target(target: str) -> tuple[str, str | None]:
    if "==" not in target:
        return target.strip(), None
    name, version = target.split("==", 1)
    return name.strip(), version.strip()


def extract_host(target: str) -> str:
    parsed = urlparse(target)
    return (parsed.hostname or "").lower()


def is_private_host(host: str) -> bool:
    try:
        return ipaddress.ip_address(host).is_private
    except ValueError:
        return host.endswith(".internal")


def edit_distance(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, char_a in enumerate(a, start=1):
        curr = [i]
        for j, char_b in enumerate(b, start=1):
            cost = 0 if char_a == char_b else 1
            curr.append(min(
                prev[j] + 1,
                curr[j - 1] + 1,
                prev[j - 1] + cost,
            ))
        prev = curr
    return prev[-1]


def is_typosquat(package_name: str, safe_names: set[str]) -> bool:
    if package_name in safe_names:
        return False
    for safe_name in safe_names:
        if edit_distance(package_name, safe_name) <= 1:
            return True
        if len(package_name) == len(safe_name):
            matcher = difflib.SequenceMatcher(a=package_name, b=safe_name)
            if matcher.ratio() >= 0.88:
                return True
    return False


def target_matches_regex(patterns: list[str], target: str) -> bool:
    for pattern in patterns:
        if re.search(pattern, target):
            return True
    return False


def target_matches_substring(patterns: list[str], target: str) -> bool:
    lowered = target.lower()
    return any(pattern.lower() in lowered for pattern in patterns)


def domain_matches(pattern: str, host: str) -> bool:
    normalized = pattern.lower().lstrip(".")
    return host == normalized or host.endswith(f".{normalized}")


def mcp_target_class(target: str) -> str:
    host = extract_host(target)
    if target.startswith("npm:"):
        return "npm_registry"
    if target.startswith("http://") and host and is_private_host(host):
        return "private_network_http"
    if target.startswith("http://") or target.startswith("https://"):
        return "remote_http"
    return "other"


def mcp_rule_matches(rule: Any, target: str) -> bool:
    if isinstance(rule, str):
        return rule == target or rule == mcp_target_class(target)
    if not isinstance(rule, dict):
        return False
    exact_target = rule.get("exact_target")
    if exact_target and exact_target == target:
        return True
    target_class = rule.get("target_class")
    if target_class and target_class == mcp_target_class(target):
        return True
    contains = rule.get("contains")
    if contains and contains.lower() in target.lower():
        return True
    regex = rule.get("regex")
    if regex and re.search(regex, target):
        return True
    return False


def heuristic_score(
    sample: dict[str, Any],
    rules: dict[str, Any],
    safe_package_names: set[str],
) -> int:
    action = sample["action_type"]
    target = sample["target"]
    score = 100

    if action == "package_install":
        package_name, version = parse_package_target(target)
        tokens = {
            "ai": 10 if package_name.startswith("ai-") else 0,
            "helper": 12,
            "toolkit": 12,
            "utils": 8,
            "llm": 18,
            "processor": 6,
            "data": 4,
        }
        lowered_name = package_name.lower()
        for token, penalty in tokens.items():
            if penalty and token in lowered_name:
                score -= penalty
        if version:
            if version.startswith("0.0."):
                score -= 25
            elif version.startswith("0."):
                score -= 12
        if is_typosquat(package_name, safe_package_names):
            score -= 40
        for signal in sample.get("signals", []):
            score -= {
                "reads_ssh_keys": 30,
                "reads_env_vars": 20,
                "spawns_child_processes": 15,
                "opens_network_socket_during_install": 35,
            }.get(signal, 10)

    elif action == "mcp_call":
        host = extract_host(target)
        if target.startswith("npm:"):
            score -= 40
        if "postmark" in target.lower():
            score -= 25
        if host and is_private_host(host):
            score -= 75
        elif target.startswith("http://"):
            score -= 25

    elif action == "api_request":
        host = extract_host(target)
        lowered_target = target.lower()
        if any(token in lowered_target for token in ("evil", "collect-data", "upload")):
            score -= 70
        if host and host.endswith(".internal"):
            score -= 20

    thresholds = rules["rules"]["reputation_thresholds"]
    warn_floor = thresholds.get("warn_below_score", 30)
    block_floor = thresholds.get("block_below_score", 10)
    score = max(0, min(100, score))
    score = max(score, 0)
    if block_floor > warn_floor:
        return score
    return score


def evaluate_sample(
    sample: dict[str, Any],
    rules_document: dict[str, Any],
    safe_package_names: set[str],
) -> dict[str, Any]:
    rules = rules_document["rules"]
    target = sample["target"]
    action = sample["action_type"]

    if action == "package_install":
        package_name, version = parse_package_target(target)
        for entry in rules["package_blocklist"]:
            if entry.get("name") != package_name:
                continue
            versions = entry.get("versions") or []
            if not versions or version in versions:
                return {"verdict": "block", "reason": f"package_blocklist:{package_name}"}

        patterns = rules.get("package_name_patterns", {})
        if target_matches_substring(patterns.get("block_if", []), package_name):
            return {"verdict": "block", "reason": "package_name_pattern:block"}
        if target_matches_substring(patterns.get("warn_if", []), package_name):
            return {"verdict": "warn", "reason": "package_name_pattern:warn"}

        if rules["typosquatting"].get("enabled") and is_typosquat(package_name, safe_package_names):
            return {"verdict": "block", "reason": "typosquatting"}

        regex_patterns = rules.get("regex_patterns", {})
        if target_matches_regex(regex_patterns.get("block_if", []), target):
            return {"verdict": "block", "reason": "regex_pattern:block"}
        if target_matches_regex(regex_patterns.get("warn_if", []), target):
            return {"verdict": "warn", "reason": "regex_pattern:warn"}

        signals = set(sample.get("signals", []))
        if signals.intersection(rules["behavioral_signals"].get("block_if", [])):
            return {"verdict": "block", "reason": "behavioral_signal:block"}
        if signals.intersection(rules["behavioral_signals"].get("warn_if", [])):
            return {"verdict": "warn", "reason": "behavioral_signal:warn"}

    elif action == "mcp_call":
        if any(mcp_rule_matches(rule, target) for rule in rules["mcp_rules"].get("block_if", [])):
            return {"verdict": "block", "reason": "mcp_rule:block"}
        if any(mcp_rule_matches(rule, target) for rule in rules["mcp_rules"].get("warn_if", [])):
            return {"verdict": "warn", "reason": "mcp_rule:warn"}

        regex_patterns = rules.get("regex_patterns", {})
        if target_matches_regex(regex_patterns.get("block_if", []), target):
            return {"verdict": "block", "reason": "regex_pattern:block"}
        if target_matches_regex(regex_patterns.get("warn_if", []), target):
            return {"verdict": "warn", "reason": "regex_pattern:warn"}

    elif action == "api_request":
        host = extract_host(target)
        for blocked_domain in rules.get("domain_blocklist", []):
            if domain_matches(blocked_domain, host):
                return {"verdict": "block", "reason": f"domain_blocklist:{blocked_domain}"}
        invented = rules.get("host_suffix_patterns", {})
        if target_matches_substring(invented.get("block_if", []), host):
            return {"verdict": "block", "reason": "host_suffix_pattern:block"}
        domain_patterns = rules.get("domain_patterns", {})
        if target_matches_substring(domain_patterns.get("block_if", []), host):
            return {"verdict": "block", "reason": "domain_pattern:block"}
        if target_matches_substring(domain_patterns.get("warn_if", []), host):
            return {"verdict": "warn", "reason": "domain_pattern:warn"}
        regex_patterns = rules.get("regex_patterns", {})
        if target_matches_regex(regex_patterns.get("block_if", []), target):
            return {"verdict": "block", "reason": "regex_pattern:block"}
        if target_matches_regex(regex_patterns.get("warn_if", []), target):
            return {"verdict": "warn", "reason": "regex_pattern:warn"}

    score = heuristic_score(sample, rules_document, safe_package_names)
    thresholds = rules["reputation_thresholds"]
    if score < thresholds["block_below_score"]:
        return {"verdict": "block", "reason": f"reputation_score:{score}"}
    if score < thresholds["warn_below_score"]:
        return {"verdict": "warn", "reason": f"reputation_score:{score}"}
    return {"verdict": "allow", "reason": f"reputation_score:{score}"}


def build_live_verdict(sample: dict[str, Any], rules_document: dict[str, Any]) -> dict[str, Any]:
    safe_cases = load_safe_corpus()
    safe_package_names = {
        parse_package_target(case["target"])[0]
        for case in safe_cases
        if case["action_type"] == "package_install"
    }
    normalized = {
        "id": sample.get("id", "live-check"),
        "action_type": sample["action_type"],
        "target": sample["target"],
        "signals": sample.get("signals", []),
    }
    result = evaluate_sample(normalized, rules_document, safe_package_names)
    heuristic = heuristic_score(normalized, rules_document, safe_package_names)
    return {
        "verdict": result["verdict"],
        "reason": result["reason"],
        "risk_score": max(0, min(100, 100 - heuristic)),
        "action": normalized,
    }


def macro_f1(expected: list[str], predicted: list[str]) -> float:
    scores = []
    for label in VERDICTS:
        tp = sum(1 for exp, pred in zip(expected, predicted) if exp == label and pred == label)
        fp = sum(1 for exp, pred in zip(expected, predicted) if exp != label and pred == label)
        fn = sum(1 for exp, pred in zip(expected, predicted) if exp == label and pred != label)
        precision = tp / (tp + fp) if (tp + fp) else 0.0
        recall = tp / (tp + fn) if (tp + fn) else 0.0
        if precision + recall == 0:
            scores.append(0.0)
        else:
            scores.append(2 * precision * recall / (precision + recall))
    return sum(scores) / len(scores)


def evaluate_rules(
    rules_document: dict[str, Any],
    attacks: list[dict[str, Any]],
    safe_cases: list[dict[str, Any]],
) -> dict[str, Any]:
    safe_package_names = {
        parse_package_target(case["target"])[0]
        for case in safe_cases
        if case["action_type"] == "package_install"
    }
    corpus = [*attacks, *safe_cases]
    expected: list[str] = []
    predicted: list[str] = []
    details: list[dict[str, Any]] = []
    for sample in corpus:
        result = evaluate_sample(sample, rules_document, safe_package_names)
        detail = {
            "id": sample["id"],
            "action_type": sample["action_type"],
            "target": sample["target"],
            "expected": sample["expected_verdict"],
            "predicted": result["verdict"],
            "reason": result["reason"],
            "signals": sample.get("signals", []),
        }
        details.append(detail)
        expected.append(sample["expected_verdict"])
        predicted.append(result["verdict"])

    exact_matches = sum(1 for exp, pred in zip(expected, predicted) if exp == pred)
    tp = sum(1 for sample, pred in zip(attacks, predicted[: len(attacks)]) if pred != "allow")
    fn = len(attacks) - tp
    fp = sum(1 for sample, pred in zip(safe_cases, predicted[len(attacks):]) if pred != "allow")
    tn = len(safe_cases) - fp
    mistakes = [detail for detail in details if detail["expected"] != detail["predicted"]]

    return {
        "accuracy": exact_matches / len(corpus),
        "f1_score": macro_f1(expected, predicted),
        "catch_rate": tp / (tp + fn) if (tp + fn) else 0.0,
        "false_pos_rate": fp / (fp + tn) if (fp + tn) else 0.0,
        "remaining_mistakes": mistakes,
        "predictions": details,
        "tp": tp,
        "fp": fp,
        "tn": tn,
        "fn": fn,
    }


def mutation_exists(sequence: list[Any], item: Any) -> bool:
    return any(existing == item for existing in sequence)


def add_blocklist_mutation(rules_document: dict[str, Any], sample: dict[str, Any]) -> Mutation | None:
    if sample["action_type"] != "package_install":
        return None
    if sample["expected_verdict"] != "block":
        return None
    package_name, version = parse_package_target(sample["target"])
    if not version:
        return None
    mutated = copy.deepcopy(rules_document)
    blocklist = mutated["rules"]["package_blocklist"]
    for entry in blocklist:
        if entry.get("name") == package_name:
            versions = entry.setdefault("versions", [])
            if version in versions:
                return None
            versions.append(version)
            return Mutation(
                category="add_blocklist_entry",
                description=f"blocklist {package_name}=={version}",
                mutated_rules=mutated,
            )
    blocklist.append(
        {
            "name": package_name,
            "versions": [version],
            "reason": "MERCK learned exact block",
            "severity": "high",
        }
    )
    return Mutation(
        category="add_blocklist_entry",
        description=f"blocklist {package_name}=={version}",
        mutated_rules=mutated,
    )


def enable_typosquatting_mutation(
    rules_document: dict[str, Any],
    sample: dict[str, Any],
    safe_package_names: set[str],
) -> Mutation | None:
    if sample["action_type"] != "package_install":
        return None
    package_name, _ = parse_package_target(sample["target"])
    if rules_document["rules"]["typosquatting"].get("enabled"):
        return None
    if not is_typosquat(package_name, safe_package_names):
        return None
    mutated = copy.deepcopy(rules_document)
    mutated["rules"]["typosquatting"]["enabled"] = True
    return Mutation(
        category="enable_typosquatting",
        description="enable typosquatting detection",
        mutated_rules=mutated,
    )


def add_behavioral_signal_mutation(
    rules_document: dict[str, Any],
    sample: dict[str, Any],
) -> Mutation | None:
    signals = sample.get("signals", [])
    if not signals:
        return None
    target_bucket = "block_if" if sample["expected_verdict"] == "block" else "warn_if"
    mutated = copy.deepcopy(rules_document)
    current = mutated["rules"]["behavioral_signals"][target_bucket]
    for signal in signals:
        if signal not in current:
            current.append(signal)
            return Mutation(
                category="add_behavioral_signal",
                description=f"{target_bucket} signal {signal}",
                mutated_rules=mutated,
            )
    return None


def adjust_threshold_mutation(
    rules_document: dict[str, Any],
    sample: dict[str, Any],
    safe_package_names: set[str],
) -> Mutation | None:
    score = heuristic_score(sample, rules_document, safe_package_names)
    mutated = copy.deepcopy(rules_document)
    thresholds = mutated["rules"]["reputation_thresholds"]
    if sample["expected_verdict"] == "block":
        desired = min(score + 1, thresholds["warn_below_score"] - 1)
        if desired > thresholds["block_below_score"]:
            thresholds["block_below_score"] = desired
            return Mutation(
                category="adjust_threshold",
                description=f"raise block threshold to {desired}",
                mutated_rules=mutated,
            )
    if sample["expected_verdict"] == "warn":
        desired = score + 1
        if desired > thresholds["warn_below_score"]:
            thresholds["warn_below_score"] = min(desired, 99)
            return Mutation(
                category="adjust_threshold",
                description=f"raise warn threshold to {thresholds['warn_below_score']}",
                mutated_rules=mutated,
            )
    return None


def add_mcp_rule_mutation(rules_document: dict[str, Any], sample: dict[str, Any]) -> Mutation | None:
    if sample["action_type"] != "mcp_call":
        return None
    bucket = "block_if" if sample["expected_verdict"] == "block" else "warn_if"
    mutated = copy.deepcopy(rules_document)
    current = mutated["rules"]["mcp_rules"][bucket]
    target = sample["target"]
    if target.startswith("http://") and extract_host(target) and is_private_host(extract_host(target)):
        rule = {"target_class": "private_network_http"}
        if not mutation_exists(current, rule):
            current.append(rule)
            return Mutation(
                category="add_mcp_rule",
                description="mcp target_class private_network_http",
                mutated_rules=mutated,
            )
    rule = {"exact_target": target}
    if mutation_exists(current, rule):
        return None
    current.append(rule)
    return Mutation(
        category="add_mcp_rule",
        description=f"mcp exact target {target}",
        mutated_rules=mutated,
    )


def add_domain_pattern_mutation(rules_document: dict[str, Any], sample: dict[str, Any]) -> Mutation | None:
    if sample["action_type"] != "api_request":
        return None
    host = extract_host(sample["target"])
    if not host:
        return None
    mutated = copy.deepcopy(rules_document)
    blocklist = mutated["rules"]["domain_blocklist"]
    if host not in blocklist:
        blocklist.append(host)
        return Mutation(
            category="add_domain_pattern",
            description=f"domain blocklist {host}",
            mutated_rules=mutated,
        )
    patterns = mutated["rules"]["domain_patterns"]["block_if"]
    apex = ".".join(host.split(".")[-2:]) if "." in host else host
    if apex not in patterns:
        patterns.append(apex)
        return Mutation(
            category="add_domain_pattern",
            description=f"domain pattern {apex}",
            mutated_rules=mutated,
        )
    return None


def add_regex_pattern_mutation(rules_document: dict[str, Any], sample: dict[str, Any]) -> Mutation | None:
    mutated = copy.deepcopy(rules_document)
    bucket = "block_if" if sample["expected_verdict"] == "block" else "warn_if"
    regex = re.escape(sample["target"])
    current = mutated["rules"]["regex_patterns"][bucket]
    if regex in current:
        return None
    current.append(regex)
    return Mutation(
        category="add_regex_pattern",
        description=f"{bucket} regex {regex}",
        mutated_rules=mutated,
    )


def invent_rule_category_mutation(rules_document: dict[str, Any], sample: dict[str, Any]) -> Mutation | None:
    mutated = copy.deepcopy(rules_document)
    package_patterns = mutated["rules"].setdefault(
        "package_name_patterns", {"block_if": [], "warn_if": []}
    )
    if sample["action_type"] == "package_install":
        package_name, _ = parse_package_target(sample["target"])
        bucket = "block_if" if sample["expected_verdict"] == "block" else "warn_if"
        if package_name not in package_patterns[bucket]:
            package_patterns[bucket].append(package_name)
            return Mutation(
                category="invented_rule_category",
                description=f"invent package_name_patterns {bucket} {package_name}",
                mutated_rules=mutated,
            )
    if sample["action_type"] == "api_request":
        host = extract_host(sample["target"])
        invented = mutated["rules"].setdefault("host_suffix_patterns", {"block_if": []})
        suffix = ".".join(host.split(".")[-2:]) if "." in host else host
        if suffix not in invented["block_if"]:
            invented["block_if"].append(suffix)
            return Mutation(
                category="invented_rule_category",
                description=f"invent host_suffix_patterns block_if {suffix}",
                mutated_rules=mutated,
            )
    return None


def harmless_fallback_mutation(
    rules_document: dict[str, Any],
    attacks: list[dict[str, Any]],
) -> Mutation:
    sample = random.choice(attacks)
    mutated = copy.deepcopy(rules_document)
    regex = re.escape(sample["target"])
    current = mutated["rules"]["regex_patterns"]["block_if"]
    if regex not in current:
        current.append(regex)
        return Mutation(
            category="add_regex_pattern",
            description=f"block regex {regex}",
            mutated_rules=mutated,
        )
    mutated["rules"]["domain_patterns"]["warn_if"].append(f"noop-{int(time.time())}")
    return Mutation(
        category="add_domain_pattern",
        description="add no-op warn domain marker",
        mutated_rules=mutated,
    )


def choose_mutation(
    rules_document: dict[str, Any],
    evaluation: dict[str, Any],
    attacks: list[dict[str, Any]],
    safe_cases: list[dict[str, Any]],
    no_improvement_streak: int,
    recent_categories: deque[str],
) -> Mutation:
    safe_package_names = {
        parse_package_target(case["target"])[0]
        for case in safe_cases
        if case["action_type"] == "package_install"
    }
    indexed_samples = {sample["id"]: sample for sample in [*attacks, *safe_cases]}
    mistakes = [indexed_samples[item["id"]] for item in evaluation["remaining_mistakes"]]
    if not mistakes:
        return harmless_fallback_mutation(rules_document, attacks)

    if no_improvement_streak >= 5:
        for sample in mistakes:
            invented = invent_rule_category_mutation(rules_document, sample)
            if invented:
                return invented

    generators = [
        enable_typosquatting_mutation,
        add_behavioral_signal_mutation,
        add_mcp_rule_mutation,
        add_domain_pattern_mutation,
        add_blocklist_mutation,
        add_regex_pattern_mutation,
        adjust_threshold_mutation,
    ]
    if no_improvement_streak >= 3 and recent_categories:
        recent_set = set(recent_categories)
        reordered = []
        deferred = []
        for generator in generators:
            probe_name = generator.__name__.replace("_mutation", "")
            if any(probe_name.endswith(category.split("_", 1)[-1]) for category in recent_set):
                deferred.append(generator)
            else:
                reordered.append(generator)
        generators = reordered + deferred

    for sample in mistakes:
        for generator in generators:
            if generator is enable_typosquatting_mutation:
                mutation = generator(rules_document, sample, safe_package_names)
            elif generator is adjust_threshold_mutation:
                mutation = generator(rules_document, sample, safe_package_names)
            else:
                mutation = generator(rules_document, sample)
            if mutation:
                return mutation

    return harmless_fallback_mutation(rules_document, attacks)


def append_jsonl(record: dict[str, Any]) -> None:
    with RESULTS_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, sort_keys=True) + "\n")


def run_git_command(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )


def ensure_git_identity() -> None:
    email = run_git_command("config", "user.email").stdout.strip()
    name = run_git_command("config", "user.name").stdout.strip()
    if not email:
        run_git_command("config", "user.email", "merck-loop@local")
    if not name:
        run_git_command("config", "user.name", "MERCK Loop")


def ensure_baseline_commit() -> None:
    ensure_git_identity()
    head = run_git_command("rev-parse", "--verify", "HEAD")
    if head.returncode == 0:
        return
    run_git_command("add", "AGENTS.md", "MERCK-SPEC.md", "attacks", "safe_packages", "waasl-rules.yaml", "merck_loop.py")
    baseline = run_git_command("commit", "-m", "MERCK baseline")
    if baseline.returncode != 0:
        raise RuntimeError(baseline.stderr.strip() or "Unable to create baseline commit")


def commit_rules(iteration: int, f1_score: float, description: str) -> None:
    run_git_command("add", "waasl-rules.yaml")
    commit = run_git_command(
        "commit",
        "-m",
        f"MERCK iter {iteration}: f1={f1_score:.2f} mutation={description}",
    )
    if commit.returncode != 0:
        raise RuntimeError(commit.stderr.strip() or "git commit failed")


def restore_rules_from_head() -> None:
    restore = run_git_command("restore", "--source=HEAD", "--worktree", "--", "waasl-rules.yaml")
    if restore.returncode != 0:
        raise RuntimeError(restore.stderr.strip() or "git restore failed")


def better_than(old_metrics: dict[str, Any], new_metrics: dict[str, Any]) -> bool:
    if new_metrics["false_pos_rate"] >= 0.05:
        return False
    if new_metrics["f1_score"] > old_metrics["f1_score"]:
        return True
    if math.isclose(new_metrics["f1_score"], old_metrics["f1_score"], abs_tol=1e-12):
        return new_metrics["false_pos_rate"] < old_metrics["false_pos_rate"]
    return False


def build_progress_report(
    iteration: int,
    best_f1: float,
    rules_added: int,
    rules_reverted: int,
    category_counts: Counter[str],
) -> str:
    category_bits = ", ".join(f"{name}={count}" for name, count in sorted(category_counts.items()))
    category_bits = category_bits or "none"
    return (
        "Progress report: "
        f"total_iterations={iteration} "
        f"best_f1={best_f1:.3f} "
        f"rules_added={rules_added} "
        f"rules_reverted={rules_reverted} "
        f"categories={category_bits}"
    )


def current_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def git_status_snapshot() -> dict[str, Any]:
    head = run_git_command("rev-parse", "--short", "HEAD")
    branch = run_git_command("rev-parse", "--abbrev-ref", "HEAD")
    dirty = run_git_command("status", "--short")
    return {
        "head": head.stdout.strip() or None,
        "branch": branch.stdout.strip() or None,
        "dirty": bool(dirty.stdout.strip()),
        "changes": [line for line in dirty.stdout.splitlines() if line.strip()],
        "refreshed_at": current_timestamp(),
    }


def build_status_payload(shared_state: SharedState) -> dict[str, Any]:
    with shared_state.lock:
        metrics = dict(shared_state.metrics)
        latest_record = dict(shared_state.latest_record)
        iteration = shared_state.iteration
        best_f1 = shared_state.best_f1
        corpus_counts = dict(shared_state.corpus_counts)
        pid = shared_state.pid
        port = shared_state.port
        started_at = shared_state.started_at
        rules_added = shared_state.rules_added
        rules_reverted = shared_state.rules_reverted
        category_counts = dict(shared_state.category_counts)

    return {
        "service": "merck-loop",
        "healthy": True,
        "timestamp": current_timestamp(),
        "started_at": started_at,
        "pid": pid,
        "port": port,
        "iteration": iteration,
        "best_f1": best_f1,
        "metrics": metrics,
        "corpus": corpus_counts,
        "rules_added": rules_added,
        "rules_reverted": rules_reverted,
        "mutation_categories": category_counts,
        "last_record": latest_record,
        "git": git_status_snapshot(),
    }


def status_writer(shared_state: SharedState, interval_seconds: int) -> None:
    while True:
        write_json(SECURITY_STATUS_PATH, build_status_payload(shared_state))
        time.sleep(interval_seconds)


def create_app(shared_state: SharedState) -> FastAPI:
    app = FastAPI()

    @app.get("/rules")
    def get_rules() -> dict[str, Any]:
        return load_rules()

    @app.get("/metrics")
    def get_metrics() -> dict[str, Any]:
        with shared_state.lock:
            return {
                "f1_score": shared_state.metrics.get("f1_score", 0.0),
                "catch_rate": shared_state.metrics.get("catch_rate", 0.0),
                "false_pos_rate": shared_state.metrics.get("false_pos_rate", 0.0),
                "total_iterations": shared_state.iteration,
                "best_f1": shared_state.best_f1,
            }

    @app.get("/log")
    def get_log() -> list[dict[str, Any]]:
        if not RESULTS_PATH.exists():
            return []
        lines = RESULTS_PATH.read_text().splitlines()[-20:]
        return [json.loads(line) for line in lines if line.strip()]

    @app.get("/status")
    def get_status() -> dict[str, Any]:
        return build_status_payload(shared_state)

    @app.get("/health")
    def get_health() -> dict[str, Any]:
        with shared_state.lock:
            f1_score = shared_state.metrics.get("f1_score", 0.0)
        return {
            "ok": True,
            "service": "merck-loop",
            "port": shared_state.port,
            "f1_score": f1_score,
            "timestamp": current_timestamp(),
        }

    @app.post("/check")
    def post_check(sample: dict[str, Any]) -> dict[str, Any]:
        rules_document = load_rules()
        result = build_live_verdict(sample, rules_document)
        response = {
            "ok": True,
            "timestamp": current_timestamp(),
            **result,
        }
        # Persist live verdict so the dashboard can poll it
        LIVE_VERDICTS_PATH.parent.mkdir(parents=True, exist_ok=True)
        with LIVE_VERDICTS_PATH.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(response, sort_keys=True) + "\n")
        return response

    return app


def start_api_server(shared_state: SharedState, port: int) -> threading.Thread:
    app = create_app(shared_state)
    config = uvicorn.Config(app, host="0.0.0.0", port=port, log_level="warning")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, name="merck-api", daemon=True)
    thread.start()
    return thread


def start_status_writer(shared_state: SharedState, interval_seconds: int) -> threading.Thread:
    thread = threading.Thread(
        target=status_writer,
        args=(shared_state, interval_seconds),
        name="merck-status-writer",
        daemon=True,
    )
    thread.start()
    return thread


def run_loop(args: argparse.Namespace) -> None:
    random.seed(args.seed)
    ensure_runtime_paths()
    ensure_baseline_commit()
    attacks = load_attack_corpus()
    safe_cases = load_safe_corpus()
    shared_state = SharedState()
    shared_state.port = args.port
    shared_state.corpus_counts = {"attacks": len(attacks), "safe_cases": len(safe_cases)}
    start_api_server(shared_state, args.port)
    start_status_writer(shared_state, args.status_seconds)

    current_rules = load_rules()
    current_metrics = evaluate_rules(current_rules, attacks, safe_cases)
    best_f1 = current_metrics["f1_score"]
    no_improvement_streak = 0
    recent_categories: deque[str] = deque(maxlen=3)
    progress_deadline = time.monotonic() + args.progress_seconds
    deadline = time.monotonic() + (args.duration_hours * 3600)

    with shared_state.lock:
        shared_state.metrics = dict(current_metrics)
        shared_state.best_f1 = best_f1

    iteration = 0
    while time.monotonic() < deadline:
        iteration += 1
        attacks = load_attack_corpus()
        safe_cases = load_safe_corpus()
        current_rules = load_rules()
        current_metrics = evaluate_rules(current_rules, attacks, safe_cases)
        with shared_state.lock:
            shared_state.metrics = dict(current_metrics)
            shared_state.best_f1 = max(shared_state.best_f1, current_metrics["f1_score"])
            shared_state.corpus_counts = {"attacks": len(attacks), "safe_cases": len(safe_cases)}
            shared_state.iteration = iteration

        if not current_metrics["remaining_mistakes"]:
            record = {
                "timestamp": current_timestamp(),
                "iteration": iteration,
                "accuracy": current_metrics["accuracy"],
                "f1_score": current_metrics["f1_score"],
                "catch_rate": current_metrics["catch_rate"],
                "false_pos_rate": current_metrics["false_pos_rate"],
                "mutation": "steady_state",
                "mutation_category": "none",
                "result": "steady",
                "remaining_mistakes": [],
            }
            append_jsonl(record)
            with shared_state.lock:
                shared_state.latest_record = dict(record)
            print(
                f"Iteration {iteration}: "
                f"f1={current_metrics['f1_score']:.3f} "
                f"catch={current_metrics['catch_rate']:.3f} "
                f"fp={current_metrics['false_pos_rate']:.3f} "
                "mutation=steady_state result=steady",
                flush=True,
            )
            if time.monotonic() >= progress_deadline:
                with shared_state.lock:
                    report = build_progress_report(
                        iteration=shared_state.iteration,
                        best_f1=shared_state.best_f1,
                        rules_added=shared_state.rules_added,
                        rules_reverted=shared_state.rules_reverted,
                        category_counts=shared_state.category_counts,
                    )
                print(report, flush=True)
                progress_deadline += args.progress_seconds
            time.sleep(max(args.sleep_seconds, args.status_seconds))
            continue

        mutation = choose_mutation(
            current_rules,
            current_metrics,
            attacks,
            safe_cases,
            no_improvement_streak,
            recent_categories,
        )
        old_metrics = current_metrics
        save_rules(mutation.mutated_rules)
        new_rules = load_rules()
        new_metrics = evaluate_rules(new_rules, attacks, safe_cases)
        kept = better_than(old_metrics, new_metrics)

        if kept:
            commit_rules(iteration, new_metrics["f1_score"], mutation.description)
            current_rules = new_rules
            current_metrics = new_metrics
            recent_categories.append(mutation.category)
            best_f1 = max(best_f1, new_metrics["f1_score"])
            improved = new_metrics["f1_score"] > old_metrics["f1_score"] or (
                math.isclose(new_metrics["f1_score"], old_metrics["f1_score"], abs_tol=1e-12)
                and new_metrics["false_pos_rate"] < old_metrics["false_pos_rate"]
            )
            no_improvement_streak = 0 if improved else no_improvement_streak + 1
            result = "kept"
            with shared_state.lock:
                shared_state.rules_added += 1
                shared_state.category_counts[mutation.category] += 1
        else:
            restore_rules_from_head()
            current_rules = load_rules()
            current_metrics = evaluate_rules(current_rules, attacks, safe_cases)
            no_improvement_streak += 1
            result = "reverted"
            with shared_state.lock:
                shared_state.rules_reverted += 1

        record = {
            "timestamp": current_timestamp(),
            "iteration": iteration,
            "accuracy": current_metrics["accuracy"] if kept else new_metrics["accuracy"],
            "f1_score": current_metrics["f1_score"] if kept else new_metrics["f1_score"],
            "catch_rate": current_metrics["catch_rate"] if kept else new_metrics["catch_rate"],
            "false_pos_rate": current_metrics["false_pos_rate"] if kept else new_metrics["false_pos_rate"],
            "mutation": mutation.description,
            "mutation_category": mutation.category,
            "result": result,
            "remaining_mistakes": (current_metrics if kept else new_metrics)["remaining_mistakes"],
        }
        append_jsonl(record)

        with shared_state.lock:
            shared_state.iteration = iteration
            shared_state.metrics = dict(current_metrics)
            shared_state.best_f1 = best_f1
            shared_state.latest_record = dict(record)
            shared_state.corpus_counts = {"attacks": len(attacks), "safe_cases": len(safe_cases)}

        print(
            f"Iteration {iteration}: "
            f"f1={(current_metrics if kept else new_metrics)['f1_score']:.3f} "
            f"catch={(current_metrics if kept else new_metrics)['catch_rate']:.3f} "
            f"fp={(current_metrics if kept else new_metrics)['false_pos_rate']:.3f} "
            f"mutation={mutation.description} "
            f"result={result}",
            flush=True,
        )

        if time.monotonic() >= progress_deadline:
            with shared_state.lock:
                report = build_progress_report(
                    iteration=shared_state.iteration,
                    best_f1=shared_state.best_f1,
                    rules_added=shared_state.rules_added,
                    rules_reverted=shared_state.rules_reverted,
                    category_counts=shared_state.category_counts,
                )
            print(report, flush=True)
            progress_deadline += args.progress_seconds

        if args.sleep_seconds > 0:
            time.sleep(args.sleep_seconds)

    end_at = datetime.now(timezone.utc)
    print(f"MERCK loop finished at {end_at.isoformat()}", flush=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the MERCK self-improvement loop.")
    parser.add_argument("--duration-hours", type=float, default=3.0)
    parser.add_argument("--port", type=int, default=8081)
    parser.add_argument("--progress-seconds", type=int, default=DEFAULT_PROGRESS_SECONDS)
    parser.add_argument("--status-seconds", type=int, default=DEFAULT_STATUS_SECONDS)
    parser.add_argument("--sleep-seconds", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=7)
    return parser.parse_args()


if __name__ == "__main__":
    run_loop(parse_args())
