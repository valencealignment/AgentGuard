#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "ops" / "reports" / "integration"
SUMMARY_JSON = OUTPUT_DIR / "modal_research_summary.json"
SUMMARY_MD = OUTPUT_DIR / "modal_research_summary.md"

try:
    import modal  # type: ignore
except Exception:  # pragma: no cover - local fallback is still valid
    modal = None


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_events(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    payloads: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            payloads.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return payloads


def summarize() -> dict[str, Any]:
    events = []
    for name in ("integration", "ui", "security", "demo"):
        events.extend(read_events(ROOT / "ops" / "events" / f"{name}.jsonl"))
    events = sorted(events, key=lambda item: item.get("ts", ""))
    decisions = [event for event in events if str(event.get("type", "")).startswith("decision.")]
    payload = {
        "generated_at": utc_now(),
        "event_count": len(events),
        "decision_count": len(decisions),
        "latest_events": events[-10:],
        "latest_decisions": decisions[-10:],
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    SUMMARY_JSON.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    SUMMARY_MD.write_text(
        "\n".join(
            [
                "# Modal Research Summary",
                "",
                f"Generated at `{payload['generated_at']}`",
                "",
                f"- Events observed: `{payload['event_count']}`",
                f"- Decisions observed: `{payload['decision_count']}`",
                "",
                "## Latest Decisions",
                *[
                    f"- `{item.get('type')}`: {item.get('title', 'untitled')}"
                    for item in payload["latest_decisions"]
                ],
                "",
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    return payload


def run_loop(interval_seconds: int) -> None:
    while True:
        summarize()
        time.sleep(interval_seconds)


if modal is not None:  # pragma: no cover - not exercised locally
    app = modal.App("waal-modal-research")
    image = modal.Image.debian_slim().pip_install()

    @app.function(image=image, timeout=600)
    def run_once() -> dict[str, Any]:
        return summarize()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--interval-seconds", type=int, default=120)
    args = parser.parse_args()
    if args.once:
        summarize()
        return 0
    run_loop(args.interval_seconds)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
