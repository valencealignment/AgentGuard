#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4


ROOT = Path(__file__).resolve().parents[1]
MERCK_RESULTS = ROOT / "merck_results.jsonl"
RULES_PATH = ROOT / "waasl-rules.yaml"
SECURITY_STATUS = ROOT / "ops" / "status" / "security.json"
AGG_EVENTS = ROOT / "ops" / "events" / "aggregate.jsonl"
WATCHBOARD = ROOT / "ops" / "watchboard-state.json"
KANBAN = ROOT / "ops" / "kanban.json"
AGG_STATUS = ROOT / "ops" / "status" / "aggregate.json"
HEARTBEAT = ROOT / "ops" / "status" / "computer-2-heartbeat.json"
STATUS_MD = ROOT / "ops" / "status" / "computer-2.md"
STATUS_JSONL = ROOT / "ops" / "status" / "computer-2.jsonl"
LATEST_REPORT = ROOT / "ops" / "reports" / "integration" / "latest.md"
BLOG_PATH = ROOT / "ops" / "reports" / "blogs" / "litellm-supply-chain-advisory.md"
NOTIF_DIR = ROOT / "ops" / "notifications"
APPROVAL_DIR = ROOT / "ops" / "approvals"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return default


def tail_jsonl(path: Path, limit: int) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text().splitlines()[-limit:]:
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return rows


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def append_jsonl(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, sort_keys=True) + "\n")


def status_line(kind: str, title: str, detail: str, artifacts: list[str] | None = None) -> dict[str, Any]:
    return {
        "ts": now_iso(),
        "machine": "computer-2",
        "kind": kind,
        "title": title,
        "detail": detail,
        "needs": [],
        "artifacts": artifacts or [],
    }


def load_heartbeats() -> dict[str, Any]:
    result = {}
    for path in (ROOT / "ops" / "status").glob("*heartbeat.json"):
        data = load_json(path, {})
        machine = data.get("machine") or path.stem.replace("-heartbeat", "")
        ts = data.get("ts") or data.get("timestamp")
        freshness = "unknown"
        stale = True
        if ts:
            try:
                age = (datetime.now(timezone.utc) - datetime.fromisoformat(ts)).total_seconds()
                stale = age > 180
                freshness = "stale" if stale else "fresh"
            except ValueError:
                freshness = "unknown"
        result[machine] = {"freshness": freshness, "stale": stale, "ts": ts}
    for machine in ("computer-1", "computer-2", "computer-3", "computer-4"):
        result.setdefault(machine, {"freshness": "unknown", "stale": True, "ts": None})
    return result


def build_event(event_type: str, subject_kind: str, subject_id: str, title: str, summary: str, **kwargs: Any) -> dict[str, Any]:
    event = {
        "id": f"evt-{uuid4()}",
        "ts": now_iso(),
        "source": "computer-2",
        "type": event_type,
        "subject_kind": subject_kind,
        "subject_id": subject_id,
        "severity": kwargs.get("severity", "info"),
        "decision": kwargs.get("decision", "none"),
        "reputation_delta": kwargs.get("reputation_delta", 0),
        "title": title,
        "summary": summary,
        "status": kwargs.get("status", "complete"),
        "artifacts": kwargs.get("artifacts", []),
    }
    return event


def write_notification_artifacts(latest: dict[str, Any]) -> list[str]:
    artifacts = []
    blocked = {
        "ts": now_iso(),
        "machine": "computer-2",
        "type": "blocked-agent",
        "title": "High-confidence block decisions available",
        "summary": "MERCK is publishing block decisions with zero observed false positives on the current corpus.",
        "latest_iteration": latest.get("iteration"),
        "f1_score": latest.get("f1_score"),
    }
    high_risk = {
        "ts": now_iso(),
        "machine": "computer-2",
        "type": "human-review",
        "title": "Review adjacent LiteLLM releases before promotion",
        "summary": "The generated corpus keeps litellm==1.82.9 at warn for manual review.",
        "severity": "high",
    }
    for name, payload in {
        "blocked-agent-latest": blocked,
        "high-risk-human-review": high_risk,
    }.items():
        path = NOTIF_DIR / f"{name}.json"
        write_json(path, payload)
        artifacts.append(str(path.relative_to(ROOT)))
    return artifacts


def write_approval_artifacts() -> list[str]:
    payload = {
        "ts": now_iso(),
        "machine": "computer-2",
        "approval_type": "publication",
        "status": "pending",
        "title": "Approve LiteLLM advisory publication",
        "artifact": str(BLOG_PATH.relative_to(ROOT)),
    }
    path = APPROVAL_DIR / "blog-publication.json"
    write_json(path, payload)
    return [str(path.relative_to(ROOT))]


def build_watchboard(security: dict[str, Any], results: list[dict[str, Any]], heartbeats: dict[str, Any]) -> dict[str, Any]:
    latest = results[-1] if results else {}
    recent_decisions = [
        {
            "iteration": row.get("iteration"),
            "decision": "block" if row.get("catch_rate", 0) >= 1 else "escalate",
            "f1_score": row.get("f1_score"),
            "false_pos_rate": row.get("false_pos_rate"),
            "mutation": row.get("mutation"),
        }
        for row in results[-5:]
    ]
    recent_scans = [
        {
            "iteration": row.get("iteration"),
            "accuracy": row.get("accuracy"),
            "catch_rate": row.get("catch_rate"),
            "false_pos_rate": row.get("false_pos_rate"),
            "result": row.get("result"),
        }
        for row in results[-5:]
    ]
    pending_approvals = []
    if APPROVAL_DIR.exists():
        pending_approvals = [load_json(path, {}) for path in sorted(APPROVAL_DIR.glob("*.json"))]
    notifications = []
    if NOTIF_DIR.exists():
        notifications = [load_json(path, {}) for path in sorted(NOTIF_DIR.glob("*.json"))]
    return {
        "overall_system_health": "healthy" if security.get("healthy") else "degraded",
        "current_rules_version": 1,
        "recent_decisions": recent_decisions,
        "recent_scans": recent_scans,
        "agent_reputation_summary": {
            "computer-2": {
                "score": 100 if latest.get("false_pos_rate", 1) == 0 else 80,
                "f1_score": latest.get("f1_score"),
            }
        },
        "package_reputation_summary": {
            "litellm": {"status": "blocked versions 1.82.7/1.82.8, warn 1.82.9"},
            "requestsx": {"status": "typosquat blocked"},
            "openai-platform.com": {"status": "lookalike warned"},
        },
        "pending_approvals": pending_approvals,
        "recent_notifications": notifications,
        "per_computer_heartbeat_freshness": heartbeats,
        "degraded_flags": {
            "stale_lanes": [name for name, data in heartbeats.items() if data.get("stale")],
            "missing_upstreams": [name for name, data in heartbeats.items() if data.get("ts") is None and name != "computer-2"],
        },
    }


def build_kanban(heartbeats: dict[str, Any], latest: dict[str, Any]) -> dict[str, Any]:
    now = now_iso()
    return {
        "lanes": {
            "computer-1": {
                "status": "unknown",
                "latest_task_title": "awaiting lane output",
                "last_update_timestamp": heartbeats["computer-1"]["ts"],
                "blocker": "No heartbeat artifact found",
                "heartbeat_freshness": heartbeats["computer-1"]["freshness"],
            },
            "computer-2": {
                "status": "running",
                "latest_task_title": "MERCK corpus watch + aggregate publishing",
                "last_update_timestamp": now,
                "blocker": None,
                "heartbeat_freshness": heartbeats["computer-2"]["freshness"],
            },
            "computer-3": {
                "status": "unknown",
                "latest_task_title": "awaiting lane output",
                "last_update_timestamp": heartbeats["computer-3"]["ts"],
                "blocker": "No heartbeat artifact found",
                "heartbeat_freshness": heartbeats["computer-3"]["freshness"],
            },
            "computer-4": {
                "status": "unknown",
                "latest_task_title": "awaiting lane output",
                "last_update_timestamp": heartbeats["computer-4"]["ts"],
                "blocker": "No heartbeat artifact found",
                "heartbeat_freshness": heartbeats["computer-4"]["freshness"],
            },
        },
        "latest_result": {
            "iteration": latest.get("iteration"),
            "f1_score": latest.get("f1_score"),
            "false_pos_rate": latest.get("false_pos_rate"),
        },
    }


def build_aggregate_status(watchboard: dict[str, Any], security: dict[str, Any]) -> dict[str, Any]:
    return {
        "ts": now_iso(),
        "overall_health": watchboard.get("overall_system_health", "unknown"),
        "service": "waasl-aggregate",
        "security_service": security.get("service", "merck-loop"),
        "degraded_flags": watchboard.get("degraded_flags", {}),
    }


def write_markdown_report(watchboard: dict[str, Any], latest: dict[str, Any]) -> None:
    LATEST_REPORT.parent.mkdir(parents=True, exist_ok=True)
    body = "\n".join(
        [
            "# Computer 2 Integration Report",
            "",
            f"- Timestamp: {now_iso()}",
            f"- Latest iteration: {latest.get('iteration')}",
            f"- F1 score: {latest.get('f1_score')}",
            f"- False positive rate: {latest.get('false_pos_rate')}",
            f"- Overall health: {watchboard.get('overall_system_health')}",
            f"- Missing upstreams: {', '.join(watchboard['degraded_flags']['missing_upstreams']) or 'none'}",
        ]
    )
    LATEST_REPORT.write_text(body + "\n", encoding="utf-8")


def run(interval_seconds: int) -> None:
    last_status_key = None
    while True:
        security = load_json(SECURITY_STATUS, {})
        results = tail_jsonl(MERCK_RESULTS, 20)
        latest = results[-1] if results else {}

        heartbeat = {
            "ts": now_iso(),
            "machine": "computer-2",
            "service": "integration-sidecar",
            "status": "running",
            "artifacts": [
                "ops/watchboard-state.json",
                "ops/kanban.json",
                "ops/status/aggregate.json",
            ],
        }
        write_json(HEARTBEAT, heartbeat)

        notification_artifacts = write_notification_artifacts(latest)
        approval_artifacts = write_approval_artifacts()
        heartbeats = load_heartbeats()
        watchboard = build_watchboard(security, results, heartbeats)
        write_json(WATCHBOARD, watchboard)
        write_json(KANBAN, build_kanban(heartbeats, latest))
        write_json(AGG_STATUS, build_aggregate_status(watchboard, security))
        write_markdown_report(watchboard, latest)

        events = [
            build_event(
                "heartbeat",
                "service",
                "computer-2",
                "Computer 2 heartbeat",
                "Computer 2 published aggregate state and heartbeat artifacts.",
                artifacts=["ops/status/computer-2-heartbeat.json", "ops/watchboard-state.json"],
            ),
            build_event(
                "blog.generated",
                "blog",
                "litellm-advisory",
                "LiteLLM advisory generated",
                "LiteLLM supply-chain advisory is available for demo consumption.",
                artifacts=[str(BLOG_PATH.relative_to(ROOT))],
            ),
            build_event(
                "approval.requested",
                "approval",
                "blog-publication",
                "Advisory publication approval requested",
                "Computer 2 created a publication approval record for the LiteLLM advisory.",
                severity="medium",
                status="pending",
                artifacts=approval_artifacts,
            ),
            build_event(
                "notification.sent",
                "service",
                "computer-2",
                "Demo notifications published",
                "Blocked-agent and high-risk human-review notifications were refreshed.",
                artifacts=notification_artifacts,
            ),
        ]
        if latest:
            decision_type = "decision.block" if latest.get("catch_rate", 0) >= 1 else "decision.escalate"
            events.append(
                build_event(
                    decision_type,
                    "service",
                    "merck-loop",
                    "Latest MERCK decision snapshot",
                    f"Iteration {latest.get('iteration')} has f1={latest.get('f1_score')} and false_pos_rate={latest.get('false_pos_rate')}.",
                    severity="high" if decision_type == "decision.block" else "medium",
                    decision="block" if decision_type == "decision.block" else "escalate",
                    reputation_delta=5 if decision_type == "decision.block" else 0,
                    artifacts=["merck_results.jsonl", "waasl-rules.yaml"],
                )
            )

        for event in events:
            append_jsonl(AGG_EVENTS, event)

        line = status_line(
            "STATUS",
            "Aggregate state refreshed",
            "Computer 2 refreshed watchboard, heartbeat, approvals, notifications, and aggregate status.",
            [
                "ops/watchboard-state.json",
                "ops/kanban.json",
                "ops/status/aggregate.json",
                "ops/status/computer-2-heartbeat.json",
            ],
        )
        status_key = (latest.get("iteration"), security.get("timestamp"))
        if status_key != last_status_key:
            append_jsonl(STATUS_JSONL, line)
            STATUS_MD.parent.mkdir(parents=True, exist_ok=True)
            STATUS_MD.write_text(
                "\n".join(
                    [
                        "# Computer 2 Status",
                        "",
                        f"- Last update: {line['ts']}",
                        f"- Detail: {line['detail']}",
                        f"- Latest iteration: {latest.get('iteration', 'unknown')}",
                        f"- Latest F1: {latest.get('f1_score', 'unknown')}",
                        f"- Latest false positive rate: {latest.get('false_pos_rate', 'unknown')}",
                    ]
                )
                + "\n",
                encoding="utf-8",
            )
            last_status_key = status_key

        time.sleep(interval_seconds)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Publish Computer 2 aggregate integration artifacts.")
    parser.add_argument("--interval-seconds", type=int, default=60)
    return parser.parse_args()


if __name__ == "__main__":
    run(parse_args().interval_seconds)
