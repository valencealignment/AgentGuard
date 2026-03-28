#!/usr/bin/env python3

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys


MODULE_PATH = Path(__file__).resolve().parents[2] / "services" / "demo-validation" / "scenario_runner.py"
SPEC = spec_from_file_location("scenario_runner", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load scenario runner from {MODULE_PATH}")

module = module_from_spec(SPEC)
sys.modules[SPEC.name] = module
SPEC.loader.exec_module(module)


if __name__ == "__main__":
    module.main()
