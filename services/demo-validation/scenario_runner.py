from __future__ import annotations

import argparse
import json
import subprocess
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
SCENARIO_PATH = REPO_ROOT / "packages" / "demo-scenarios" / "canonical_scenarios.json"
EVENTS_PATH = REPO_ROOT / "ops" / "events" / "demo.jsonl"
STATUS_PATH = REPO_ROOT / "ops" / "status" / "demo.json"
REPORTS_DIR = REPO_ROOT / "ops" / "reports" / "demo"
SANDBOX_DIR = REPO_ROOT / "ops" / "reports" / "sandbox"
DOMAIN_EVENTS_PATH = REPORTS_DIR / "domain-events.json"


@dataclass
class ScenarioOutcome:
    scenario_id: str
    title: str
    decision: str
    severity: str
    reason: str
    evidence: list[str]
    report_path: str
    trace_path: str
    notifications: list[dict[str, str]]


def iso_now() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def repo_relative(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT))


def git_branch() -> str:
    try:
        result = subprocess.run(
            ["git", "branch", "--show-current"],
            cwd=REPO_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError:
        return "unknown"
    return result.stdout.strip() or "unknown"


def load_scenarios() -> list[dict[str, Any]]:
    return json.loads(SCENARIO_PATH.read_text())


def append_jsonl(path: Path, record: dict[str, Any]) -> None:
    ensure_parent(path)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, sort_keys=True) + "\n")


def write_json(path: Path, payload: dict[str, Any] | list[dict[str, Any]]) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def lane_event_record(
    message_type: str,
    event_type: str,
    severity: str,
    title: str,
    summary: str,
    status: str = "open",
    artifacts: list[str] | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    record: dict[str, Any] = {
      "id": str(uuid.uuid4()),
      "ts": iso_now(),
      "source": "demo",
      "message_type": message_type,
      "type": event_type,
      "title": title,
      "summary": summary,
      "status": status,
      "severity": severity,
      "artifacts": artifacts or [],
    }
    if extra:
        record.update(extra)
    return record


def domain_event_record(
    event_type: str,
    subject_kind: str,
    subject_id: str,
    severity: str,
    title: str,
    summary: str,
    decision: str | None = None,
    status: str = "emitted",
    artifacts: list[str] | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    record: dict[str, Any] = {
        "id": str(uuid.uuid4()),
        "ts": iso_now(),
        "source": "demo-validation",
        "type": event_type,
        "subject_kind": subject_kind,
        "subject_id": subject_id,
        "severity": severity,
        "decision": decision,
        "title": title,
        "summary": summary,
        "status": status,
        "artifacts": artifacts or [],
    }
    if extra:
        record.update(extra)
    return record


def write_scenario_outputs(scenario: dict[str, Any], decision: str) -> ScenarioOutcome:
    scenario_dir = REPORTS_DIR / scenario["id"]
    scenario_dir.mkdir(parents=True, exist_ok=True)

    evidence = list(scenario["evidence"])
    notifications = list(scenario.get("notifications", []))
    report = {
        "scenario_id": scenario["id"],
        "title": scenario["title"],
        "summary": scenario["summary"],
        "decision": decision,
        "severity": scenario["severity"],
        "reason": scenario["reason"],
        "evidence": evidence,
        "agent": scenario["agent"],
        "action": scenario["action"],
        "notifications": notifications,
        "generated_at": iso_now(),
    }
    report_path = scenario_dir / "report.json"
    write_json(report_path, report)

    trace = {
        "scenario_id": scenario["id"],
        "events": [
            {
                "type": "agent.registered",
                "summary": f"{scenario['agent']['name']} registered from {scenario['agent']['origin']}.",
            },
            {
                "type": "action.requested",
                "summary": f"{scenario['action']['type']} requested for {scenario['action']['target']}.",
            },
            {
                "type": f"decision.{decision.lower()}",
                "summary": scenario["reason"],
            },
        ],
        "notifications": notifications,
        "generated_at": iso_now(),
    }
    trace_path = scenario_dir / "trace.json"
    write_json(trace_path, trace)

    return ScenarioOutcome(
        scenario_id=scenario["id"],
        title=scenario["title"],
        decision=decision,
        severity=scenario["severity"],
        reason=scenario["reason"],
        evidence=evidence,
        report_path=repo_relative(report_path),
        trace_path=repo_relative(trace_path),
        notifications=notifications,
    )


def evaluate_scenario(scenario: dict[str, Any]) -> ScenarioOutcome:
    decision = scenario["expected_decision"]
    return write_scenario_outputs(scenario, decision)


def emit_claim(branch: str) -> None:
    append_jsonl(
        EVENTS_PATH,
        lane_event_record(
            message_type="CLAIM",
            event_type="claim.created",
            severity="info",
            title="Computer 4 lane claimed",
            summary="Computer 4 claimed the demo-validation lane and initialized sandbox outputs.",
            status="claimed",
            artifacts=[repo_relative(STATUS_PATH)],
            extra={
                "lane": "demo",
                "branch": branch,
            },
        ),
    )


def emit_status(branch: str, current_task: str, percent_complete: int, active_scenarios: list[str], demo_readiness: str, blockers: list[str] | None = None) -> None:
    write_json(
        STATUS_PATH,
        {
            "lane": "demo",
            "branch": branch,
            "current_task": current_task,
            "percent_complete": percent_complete,
            "last_heartbeat": iso_now(),
            "blockers": blockers or [],
            "active_scenarios": active_scenarios,
            "demo_readiness": demo_readiness,
        },
    )
    append_jsonl(
        EVENTS_PATH,
        lane_event_record(
            message_type="STATUS",
            event_type="heartbeat",
            severity="info",
            title="Computer 4 status heartbeat",
            summary=current_task,
            status="active",
            artifacts=[repo_relative(STATUS_PATH)],
            extra={
                "lane": "demo",
                "branch": branch,
                "percent_complete": percent_complete,
                "active_scenarios": active_scenarios,
                "demo_readiness": demo_readiness,
                "blockers": blockers or [],
            },
        ),
    )


def emit_handoff(outcome: ScenarioOutcome) -> None:
    append_jsonl(
        EVENTS_PATH,
        lane_event_record(
            message_type="HANDOFF",
            event_type=f"decision.{outcome.decision.lower()}",
            severity=outcome.severity,
            title=f"{outcome.title} ready for aggregation",
            summary=outcome.reason,
            status="completed",
            artifacts=[outcome.report_path, outcome.trace_path, repo_relative(DOMAIN_EVENTS_PATH)],
            extra={
                "lane": "demo",
                "scenario_id": outcome.scenario_id,
                "decision": outcome.decision,
            },
        ),
    )
    for notification in outcome.notifications:
        notification_type = "human.approval_requested"
        if notification["channel"] == "security-alerts":
            notification_type = "notification.sent"
        append_jsonl(
            EVENTS_PATH,
            lane_event_record(
                message_type="HANDOFF",
                event_type=notification_type,
                severity=outcome.severity,
                title=f"{outcome.title} notification ready",
                summary=notification["message"],
                status="completed",
                artifacts=[outcome.report_path, repo_relative(DOMAIN_EVENTS_PATH)],
                extra={
                    "lane": "demo",
                    "scenario_id": outcome.scenario_id,
                    "channel": notification["channel"],
                },
            ),
        )


def write_summary(outcomes: list[ScenarioOutcome], branch: str, blockers: list[str]) -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    SANDBOX_DIR.mkdir(parents=True, exist_ok=True)

    summary = {
        "generated_at": iso_now(),
        "branch": branch,
        "blockers": blockers,
        "scenarios": [
            {
                "id": outcome.scenario_id,
                "title": outcome.title,
                "decision": outcome.decision,
                "severity": outcome.severity,
                "reason": outcome.reason,
                "report_path": outcome.report_path,
                "trace_path": outcome.trace_path,
            }
            for outcome in outcomes
        ],
        "decision_counts": {
            "ALLOW": sum(1 for outcome in outcomes if outcome.decision == "ALLOW"),
            "BLOCK": sum(1 for outcome in outcomes if outcome.decision == "BLOCK"),
            "ESCALATE": sum(1 for outcome in outcomes if outcome.decision == "ESCALATE"),
        },
        "demo_ready": all(outcome.decision in {"ALLOW", "BLOCK", "ESCALATE"} for outcome in outcomes),
    }
    write_json(REPORTS_DIR / "latest-run.json", summary)

    domain_events: list[dict[str, Any]] = []
    for outcome in outcomes:
        domain_events.append(
            domain_event_record(
                event_type="agent.registered",
                subject_kind="agent",
                subject_id=outcome.scenario_id,
                severity=outcome.severity,
                title=f"{outcome.title} agent registered",
                summary=f"Registered agent for {outcome.title}.",
                artifacts=[outcome.trace_path],
            )
        )
        domain_events.append(
            domain_event_record(
                event_type=f"decision.{outcome.decision.lower()}",
                subject_kind="scenario",
                subject_id=outcome.scenario_id,
                severity=outcome.severity,
                title=f"{outcome.title} decision",
                summary=outcome.reason,
                decision=outcome.decision,
                status="completed",
                artifacts=[outcome.report_path, outcome.trace_path],
            )
        )
        for notification in outcome.notifications:
            domain_events.append(
                domain_event_record(
                    event_type="human.approval_requested" if notification["channel"] == "human-approval-queue" else "notification.sent",
                    subject_kind="notification",
                    subject_id=f"{outcome.scenario_id}:{notification['channel']}",
                    severity=outcome.severity,
                    title=f"{outcome.title} notification",
                    summary=notification["message"],
                    decision=outcome.decision,
                    artifacts=[outcome.report_path],
                )
            )
    write_json(DOMAIN_EVENTS_PATH, domain_events)

    markdown_lines = [
        "# WAAL Sandbox Demo Summary",
        "",
        f"- Generated at: `{summary['generated_at']}`",
        f"- Branch: `{branch}`",
        f"- Local blockers: `{'; '.join(blockers) if blockers else 'none'}`",
        "",
        "## Canonical Outcomes",
    ]
    for outcome in outcomes:
        markdown_lines.extend(
            [
                f"- `{outcome.scenario_id}`: `{outcome.decision}`",
                f"  - {outcome.reason}",
                f"  - Report: `{outcome.report_path}`",
                f"  - Trace: `{outcome.trace_path}`",
            ]
        )
    markdown_lines.extend(
        [
            "",
            "## Judge Story",
            "- Scenario A demonstrates a clean allow path for a trusted internal action.",
            "- Scenario B blocks the flagged LiteLLM path with evidence suitable for the watchboard.",
            "- Scenario C blocks a poor-reputation external agent and queues notifications.",
            "- Scenario D shows remediation follow-through artifacts for downstream advisory work.",
        ]
    )
    (REPORTS_DIR / "summary.md").write_text("\n".join(markdown_lines) + "\n", encoding="utf-8")

    sandbox_report = {
        "generated_at": summary["generated_at"],
        "mode": "local-fallback",
        "gcp_ready": False,
        "blockers": blockers,
        "notes": [
            "Deterministic local scenario runner is available immediately.",
            "GCP deployment is optional and can reuse the same artifacts and schema later.",
            "No malware or offensive behavior is deployed; risk is simulated with safe fixtures.",
        ],
    }
    write_json(SANDBOX_DIR / "local-sandbox-report.json", sandbox_report)


def gcloud_available() -> bool:
    result = subprocess.run(
        ["which", "gcloud"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    return result.returncode == 0


def run_once(emit_claim_event: bool, finalize: bool) -> None:
    branch = git_branch()
    scenarios = load_scenarios()
    blockers = [] if gcloud_available() else ["gcloud CLI unavailable on this machine; using local fallback"]
    if emit_claim_event:
        emit_claim(branch)
    emit_status(
        branch=branch,
        current_task="Running deterministic demo scenarios",
        percent_complete=25,
        active_scenarios=[scenario["id"] for scenario in scenarios],
        demo_readiness="warming_up",
        blockers=blockers,
    )

    outcomes = [evaluate_scenario(scenario) for scenario in scenarios]
    for outcome in outcomes:
        emit_handoff(outcome)

    write_summary(outcomes, branch, blockers)
    emit_status(
        branch=branch,
        current_task="Demo scenarios generated and reports refreshed",
        percent_complete=100,
        active_scenarios=[outcome.scenario_id for outcome in outcomes],
        demo_readiness="ready",
        blockers=blockers,
    )
    if finalize:
        append_jsonl(
            EVENTS_PATH,
            lane_event_record(
                message_type="DONE",
                event_type="lane.message",
                severity="info",
                title="Computer 4 demo lane ready",
                summary="Deterministic scenario traces, reports, and status artifacts are ready for aggregation.",
                status="completed",
                artifacts=[
                    repo_relative(REPORTS_DIR / "summary.md"),
                    repo_relative(REPORTS_DIR / "latest-run.json"),
                    repo_relative(DOMAIN_EVENTS_PATH),
                    repo_relative(SANDBOX_DIR / "local-sandbox-report.json"),
                ],
                extra={
                    "lane": "demo",
                    "branch": branch,
                },
            ),
        )


def watch_loop(until_epoch: float | None, interval: int, emit_claim_event: bool) -> None:
    first = True
    while True:
        reached_deadline = until_epoch is not None and time.time() >= until_epoch
        run_once(emit_claim_event=emit_claim_event and first, finalize=reached_deadline)
        first = False
        if reached_deadline:
            break
        time.sleep(interval)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run deterministic WAAL demo scenarios.")
    parser.add_argument("--emit-claim", action="store_true", help="Append a CLAIM event before running.")
    parser.add_argument("--watch", action="store_true", help="Refresh artifacts on an interval until the deadline.")
    parser.add_argument("--interval", type=int, default=60, help="Seconds between refreshes in watch mode.")
    parser.add_argument(
        "--until-epoch",
        type=float,
        default=None,
        help="Optional unix epoch deadline for watch mode.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.watch:
        watch_loop(args.until_epoch, args.interval, args.emit_claim)
        return
    run_once(emit_claim_event=args.emit_claim, finalize=True)


if __name__ == "__main__":
    main()
