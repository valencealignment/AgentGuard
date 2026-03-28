#!/usr/bin/env python3
from __future__ import annotations

import argparse

from common import append_jsonl, lane_event_path, new_event, upsert_status


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lane", required=True)
    parser.add_argument("--task", default="heartbeat")
    args = parser.parse_args()

    payload = upsert_status(args.lane, {"current_task": args.task})
    append_jsonl(
        lane_event_path(args.lane),
        new_event(
            args.lane,
            "STATUS",
            title=f"{args.lane} heartbeat",
            summary=f"Heartbeat for {payload.get('current_task', 'unknown')}",
            type="heartbeat",
            status="ok",
        ),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
