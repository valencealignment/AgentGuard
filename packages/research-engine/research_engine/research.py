from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]


def generated_path() -> Path:
    return ROOT / "attacks" / "generated.json"


def generated_safe_path() -> Path:
    return ROOT / "safe_packages" / "generated.json"


def advisory_path() -> Path:
    return ROOT / "ops" / "reports" / "blogs" / "litellm-supply-chain-advisory.md"


def generated_cases() -> list[dict[str, Any]]:
    return json.loads(generated_path().read_text())


def generated_safe_cases() -> list[dict[str, Any]]:
    return json.loads(generated_safe_path().read_text())


def write_generated_cases(cases: list[dict[str, Any]]) -> None:
    generated_path().parent.mkdir(parents=True, exist_ok=True)
    generated_path().write_text(json.dumps(cases, indent=2) + "\n", encoding="utf-8")


def write_generated_safe_cases(cases: list[dict[str, Any]]) -> None:
    generated_safe_path().parent.mkdir(parents=True, exist_ok=True)
    generated_safe_path().write_text(json.dumps(cases, indent=2) + "\n", encoding="utf-8")


def write_advisory(markdown: str) -> None:
    advisory_path().parent.mkdir(parents=True, exist_ok=True)
    advisory_path().write_text(markdown, encoding="utf-8")
