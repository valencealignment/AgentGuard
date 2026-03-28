from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


from importlib.util import module_from_spec, spec_from_file_location


MODULE_PATH = Path(__file__).resolve().parents[1] / "scenario_runner.py"
SPEC = spec_from_file_location("scenario_runner", MODULE_PATH)
scenario_runner = module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = scenario_runner
SPEC.loader.exec_module(scenario_runner)


class ScenarioRunnerTests(unittest.TestCase):
    def test_scenarios_cover_required_decisions(self) -> None:
        scenarios = json.loads((Path(__file__).resolve().parents[3] / "packages" / "demo-scenarios" / "canonical_scenarios.json").read_text())
        decisions = {scenario["expected_decision"] for scenario in scenarios}
        self.assertIn("ALLOW", decisions)
        self.assertIn("BLOCK", decisions)

    def test_lane_event_record_uses_contract_message_types(self) -> None:
        payload = scenario_runner.lane_event_record(
            message_type="HANDOFF",
            event_type="decision.block",
            severity="high",
            title="Scenario handoff",
            summary="Blocked risky package path.",
        )
        self.assertEqual(payload["message_type"], "HANDOFF")
        self.assertEqual(payload["type"], "decision.block")
        self.assertEqual(payload["source"], "demo")

    def test_write_summary_marks_demo_ready(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_root = Path(temp_dir)
            original_reports_dir = scenario_runner.REPORTS_DIR
            original_sandbox_dir = scenario_runner.SANDBOX_DIR
            original_domain_events_path = scenario_runner.DOMAIN_EVENTS_PATH
            try:
                scenario_runner.REPORTS_DIR = repo_root / "ops" / "reports" / "demo"
                scenario_runner.SANDBOX_DIR = repo_root / "ops" / "reports" / "sandbox"
                scenario_runner.DOMAIN_EVENTS_PATH = scenario_runner.REPORTS_DIR / "domain-events.json"
                outcomes = [
                    scenario_runner.ScenarioOutcome(
                        scenario_id="scenario-a",
                        title="Allow path",
                        decision="ALLOW",
                        severity="info",
                        reason="safe",
                        evidence=["signed_agent_manifest"],
                        report_path="ops/reports/demo/scenario-a/report.json",
                        trace_path="ops/reports/demo/scenario-a/trace.json",
                        notifications=[],
                    ),
                    scenario_runner.ScenarioOutcome(
                        scenario_id="scenario-b",
                        title="Risk path",
                        decision="BLOCK",
                        severity="high",
                        reason="blocked",
                        evidence=["flagged_dependency_version"],
                        report_path="ops/reports/demo/scenario-b/report.json",
                        trace_path="ops/reports/demo/scenario-b/trace.json",
                        notifications=[],
                    ),
                ]
                scenario_runner.write_summary(outcomes, "codex/demo-validation", ["gcloud CLI unavailable on this machine; using local fallback"])
                payload = json.loads((scenario_runner.REPORTS_DIR / "latest-run.json").read_text())
                self.assertTrue(payload["demo_ready"])
                self.assertEqual(payload["decision_counts"]["ALLOW"], 1)
                self.assertEqual(payload["decision_counts"]["BLOCK"], 1)
                domain_events = json.loads((scenario_runner.DOMAIN_EVENTS_PATH).read_text())
                self.assertGreaterEqual(len(domain_events), 4)
            finally:
                scenario_runner.REPORTS_DIR = original_reports_dir
                scenario_runner.SANDBOX_DIR = original_sandbox_dir
                scenario_runner.DOMAIN_EVENTS_PATH = original_domain_events_path


if __name__ == "__main__":
    unittest.main()
