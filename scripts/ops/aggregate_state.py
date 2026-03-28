#!/usr/bin/env python3
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from common import ROOT, append_jsonl, read_json, utc_now, write_json


LANES = ("integration", "ui", "security", "demo")
STALE_SECONDS = 180


def parse_ts(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def age_seconds(value: str | None) -> int | None:
    parsed = parse_ts(value)
    if parsed is None:
        return None
    return int((datetime.now(timezone.utc) - parsed).total_seconds())


def read_status(lane: str) -> dict[str, Any]:
    return read_json(ROOT / "ops" / "status" / f"{lane}.json", {"lane": lane})


def read_events(lane: str, limit: int = 50) -> list[dict[str, Any]]:
    path = ROOT / "ops" / "events" / f"{lane}.jsonl"
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8").splitlines()
    payloads = []
    for line in lines[-limit:]:
        if not line.strip():
            continue
        try:
            payloads.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return payloads


def build_lane_cards() -> list[dict[str, Any]]:
    cards = []
    for lane in LANES:
        status = read_status(lane)
        seconds = age_seconds(status.get("last_heartbeat"))
        cards.append(
            {
                "lane": lane,
                "branch": status.get("branch", ""),
                "current_task": status.get("current_task", "unknown"),
                "percent_complete": status.get("percent_complete", 0),
                "demo_readiness": status.get("demo_readiness", "unknown"),
                "blockers": status.get("blockers", []),
                "last_heartbeat": status.get("last_heartbeat"),
                "heartbeat_age_seconds": seconds,
                "stale": seconds is None or seconds > STALE_SECONDS,
            }
        )
    return cards


def gather_decisions(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        event
        for event in events
        if str(event.get("type", "")).startswith("decision.") or event.get("decision")
    ][-20:]


def gather_notifications(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        event for event in events if event.get("type") == "notification.sent" or "notify" in event.get("title", "").lower()
    ][-20:]


def gather_reports(directory: Path, limit: int = 10) -> list[dict[str, Any]]:
    if not directory.exists():
        return []
    files = sorted(
        [path for path in directory.rglob("*") if path.is_file()],
        key=lambda item: item.stat().st_mtime,
        reverse=True,
    )
    return [
        {
            "path": str(path.relative_to(ROOT)),
            "updated_at": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z"),
        }
        for path in files[:limit]
    ]


def write_kanban(cards: list[dict[str, Any]]) -> None:
    backlog = []
    in_progress = []
    blocked = []
    done = []
    for card in cards:
        if card["percent_complete"] >= 100:
            done.append(card)
        elif card["blockers"]:
            blocked.append(card)
        elif card["percent_complete"] > 0:
            in_progress.append(card)
        else:
            backlog.append(card)

    payload = {
        "generated_at": utc_now(),
        "backlog": backlog,
        "in_progress": in_progress,
        "blocked": blocked,
        "done": done,
    }
    write_json(ROOT / "ops" / "kanban.json", payload)

    def line_items(items: list[dict[str, Any]]) -> str:
        if not items:
            return "- none"
        return "\n".join(
            f"- [{item['lane']}] {item['current_task']} ({item['percent_complete']}%)"
            for item in items
        )

    markdown = "\n".join(
        [
            "# WAAL Kanban",
            "",
            f"Generated at `{payload['generated_at']}`",
            "",
            "## Backlog",
            line_items(backlog),
            "",
            "## In Progress",
            line_items(in_progress),
            "",
            "## Blocked",
            line_items(blocked),
            "",
            "## Done",
            line_items(done),
            "",
        ]
    )
    (ROOT / "KANBAN.md").write_text(markdown, encoding="utf-8")


def main() -> int:
    cards = build_lane_cards()
    all_events: list[dict[str, Any]] = []
    for lane in LANES:
        all_events.extend(read_events(lane))
    all_events = sorted(all_events, key=lambda item: item.get("ts", ""))

    reports = {
        "integration": gather_reports(ROOT / "ops" / "reports" / "integration"),
        "security": gather_reports(ROOT / "ops" / "reports" / "security"),
        "blogs": gather_reports(ROOT / "ops" / "reports" / "blogs"),
        "demo": gather_reports(ROOT / "ops" / "reports" / "demo"),
    }

    aggregate = {
        "generated_at": utc_now(),
        "stale_threshold_seconds": STALE_SECONDS,
        "lanes": cards,
        "recent_events": all_events[-50:],
        "decisions": gather_decisions(all_events),
        "notifications": gather_notifications(all_events),
        "reports": reports,
    }
    write_json(ROOT / "ops" / "status" / "aggregate.json", aggregate)

    watchboard = {
        "product": {"name": "WAAL", "surface": "WAAS Wall"},
        "generated_at": aggregate["generated_at"],
        "lane_cards": cards,
        "decisions": aggregate["decisions"],
        "notifications": aggregate["notifications"],
        "research": reports["security"] + reports["blogs"] + reports["integration"],
        "demo": reports["demo"],
    }
    write_json(ROOT / "ops" / "watchboard-state.json", watchboard)
    write_kanban(cards)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
