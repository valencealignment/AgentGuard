from __future__ import annotations

import importlib.util
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]


def _load_merck_module():
    spec = importlib.util.spec_from_file_location("merck_loop_runtime", ROOT / "merck_loop.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def load_rules() -> dict[str, Any]:
    return _load_merck_module().load_rules()


def evaluate_sample(sample: dict[str, Any]) -> dict[str, Any]:
    module = _load_merck_module()
    safe_cases = module.load_json(module.SAFE_PATH)
    safe_names = {
        module.parse_package_target(case["target"])[0]
        for case in safe_cases
        if case["action_type"] == "package_install"
    }
    return module.evaluate_sample(sample, module.load_rules(), safe_names)


def evaluate_corpus() -> dict[str, Any]:
    module = _load_merck_module()
    attacks = module.load_attack_corpus()
    safe_cases = module.load_json(module.SAFE_PATH)
    return module.evaluate_rules(module.load_rules(), attacks, safe_cases)
