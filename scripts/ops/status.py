#!/usr/bin/env python3
from __future__ import annotations

import argparse

from common import append_jsonl, lane_event_path, new_event, upsert_status


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lane", required=True)
    parser.add_argument("--branch")
    parser.add_argument("--task")
    parser.add_argument("--percent", type=int)
    parser.add_argument("--demo-readiness")
    parser.add_argument("--blocker", action="append", default=[])
    parser.add_argument("--event-title")
    parser.add_argument("--event-summary")
    args = parser.parse_args()

    payload = upsert_status(
        args.lane,
        {
            "branch": args.branch,
            "current_task": args.task,
            "percent_complete": args.percent,
            "demo_readiness": args.demo_readiness,
            "blockers": args.blocker or None,
        },
    )
    if args.event_title or args.event_summary:
        append_jsonl(
            lane_event_path(args.lane),
            new_event(
                args.lane,
                "STATUS",
                title=args.event_title or f"{args.lane} status",
                summary=args.event_summary or payload["current_task"],
                branch=payload.get("branch", ""),
                current_task=payload.get("current_task", ""),
                type="lane.status",
            ),
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
