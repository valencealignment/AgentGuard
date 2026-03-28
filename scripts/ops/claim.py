#!/usr/bin/env python3
from __future__ import annotations

import argparse

from common import append_jsonl, lane_event_path, new_event, upsert_status


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lane", required=True)
    parser.add_argument("--branch", default="")
    parser.add_argument("--task", default="bootstrapping")
    args = parser.parse_args()

    append_jsonl(
        lane_event_path(args.lane),
        new_event(
            args.lane,
            "CLAIM",
            title=f"{args.lane} claimed lane",
            summary=f"Starting task: {args.task}",
            branch=args.branch,
            current_task=args.task,
            type="claim.created",
        ),
    )
    upsert_status(
        args.lane,
        {
            "branch": args.branch,
            "current_task": args.task,
            "percent_complete": 1,
        },
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
