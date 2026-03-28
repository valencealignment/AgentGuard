from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
OPS = ROOT / "ops"
EVENTS = OPS / "events"
STATUS = OPS / "status"
REPORTS = OPS / "reports"


def utc_now() -> str:
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


def lane_event_path(lane: str) -> Path:
    return EVENTS / f"{lane}.jsonl"


def lane_status_path(lane: str) -> Path:
    return STATUS / f"{lane}.json"


def normalize_lane(lane: str) -> str:
    return lane.strip().lower()


def base_status(lane: str) -> dict[str, Any]:
    return {
        "lane": normalize_lane(lane),
        "branch": "",
        "current_task": "bootstrapping",
        "percent_complete": 0,
        "last_heartbeat": utc_now(),
        "blockers": [],
        "demo_readiness": "bootstrapping"
    }


def upsert_status(lane: str, patch: dict[str, Any]) -> dict[str, Any]:
    path = lane_status_path(lane)
    payload = read_json(path, base_status(lane))
    payload.update({k: v for k, v in patch.items() if v is not None})
    payload["lane"] = normalize_lane(lane)
    payload["last_heartbeat"] = utc_now()
    write_json(path, payload)
    return payload


def new_event(
    lane: str,
    message_type: str,
    title: str,
    summary: str,
    **extra: Any,
) -> dict[str, Any]:
    payload = {
        "id": os.urandom(8).hex(),
        "ts": utc_now(),
        "source": normalize_lane(lane),
        "message_type": message_type,
        "type": extra.pop("type", "lane.message"),
        "title": title,
        "summary": summary,
        "status": extra.pop("status", "open"),
    }
    payload.update(extra)
    return payload

