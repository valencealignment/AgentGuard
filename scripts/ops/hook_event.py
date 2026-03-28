#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os

from common import append_jsonl, lane_event_path, new_event


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lane", required=True)
    parser.add_argument("--event", required=True)
    args = parser.parse_args()

    append_jsonl(
        lane_event_path(args.lane),
        new_event(
            args.lane,
            "STATUS",
            title=f"hook:{args.event}",
            summary=f"Codex hook {args.event} executed",
            type="hook.event",
            hook_event=args.event,
            cwd=os.getcwd(),
            status="ok",
        ),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
