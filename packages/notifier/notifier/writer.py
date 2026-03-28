from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]


def _write(path: Path, payload: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return path


def write_notification(name: str, payload: dict[str, Any]) -> Path:
    return _write(ROOT / "ops" / "notifications" / f"{name}.json", payload)


def write_approval(name: str, payload: dict[str, Any]) -> Path:
    return _write(ROOT / "ops" / "approvals" / f"{name}.json", payload)
