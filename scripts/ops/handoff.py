#!/usr/bin/env python3
from __future__ import annotations

import argparse

from common import append_jsonl, lane_event_path, new_event


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lane", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--summary", required=True)
    parser.add_argument("--target", default="")
    args = parser.parse_args()

    append_jsonl(
        lane_event_path(args.lane),
        new_event(
            args.lane,
            "HANDOFF",
            title=args.title,
            summary=args.summary,
            target=args.target,
            type="lane.handoff",
            status="handoff",
        ),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
