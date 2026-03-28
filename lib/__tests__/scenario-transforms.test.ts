import { describe, it, expect } from "vitest";
import {
  transformScenarioReport,
  transformScenarioTrace,
  transformScenarioEscalation,
  type ScenarioReport,
  type ScenarioTrace,
} from "../scenario-transforms";

const litellmReport: ScenarioReport = {
  scenario_id: "scenario-b-litellm-risk",
  title: "LiteLLM-centered risky path",
  summary: "A sandboxed agent attempts to install a flagged LiteLLM version.",
  decision: "BLOCK",
  severity: "high",
  reason: "Flagged dependency version and suspicious install-time signals.",
  evidence: ["flagged_dependency_version", "reads_env_vars", "reads_ssh_keys"],
  agent: { id: "agent-sandbox-risky", name: "Sandbox Runner", reputation: "unknown", origin: "sandbox" },
  action: {
    type: "package_install",
    target: "litellm==1.82.8",
    context: { workspace_only: false, network_required: true },
  },
  notifications: [
    { channel: "human-approval-queue", message: "Review flagged LiteLLM installation." },
  ],
  generated_at: "2026-03-28T12:58:21-07:00",
};

const cleanReport: ScenarioReport = {
  scenario_id: "scenario-a-clean-allow",
  title: "Clean allow path",
  summary: "A trusted internal agent requests a safe read-only action.",
  decision: "ALLOW",
  severity: "info",
  reason: "Trusted agent performing a benign read-only action.",
  evidence: ["signed_agent_manifest", "workspace_scoped_target"],
  agent: { id: "agent-local-trusted", name: "Workspace Assistant", reputation: "trusted", origin: "internal" },
  action: {
    type: "file_read",
    target: "docs/usage.md",
    context: { workspace_only: true },
  },
  notifications: [],
  generated_at: "2026-03-28T12:58:21-07:00",
};

const remediationReport: ScenarioReport = {
  scenario_id: "scenario-d-remediation-follow-through",
  title: "Remediation follow-through support",
  summary: "Follow-up artifacts for advisory generation.",
  decision: "ALLOW",
  severity: "warning",
  reason: "Generating remediation guidance is safe and needed.",
  evidence: ["derived_from_block_event", "read_only_reporting", "human_review_required"],
  agent: { id: "agent-remediation", name: "Remediation Assistant", reputation: "trusted", origin: "internal" },
  action: {
    type: "report_generation",
    target: "litellm-remediation-brief",
    context: { workspace_only: true, depends_on: "scenario-b-litellm-risk" },
  },
  notifications: [
    { channel: "human-approval-queue", message: "Approve publication of the LiteLLM remediation brief." },
  ],
  generated_at: "2026-03-28T12:58:21-07:00",
};

const litellmTrace: ScenarioTrace = {
  scenario_id: "scenario-b-litellm-risk",
  events: [
    { type: "agent.registered", summary: "Sandbox Runner registered from sandbox." },
    { type: "action.requested", summary: "package_install requested for litellm==1.82.8." },
    { type: "decision.block", summary: "Flagged dependency version." },
  ],
  notifications: [
    { channel: "human-approval-queue", message: "Review flagged LiteLLM installation." },
  ],
  generated_at: "2026-03-28T12:58:21-07:00",
};

describe("transformScenarioReport", () => {
  it("transforms a BLOCK report with notifications to ESCALATE", () => {
    const decision = transformScenarioReport(litellmReport);
    expect(decision.verdict).toBe("ESCALATE");
  });

  it("keeps ALLOW verdict when there are no notifications", () => {
    const decision = transformScenarioReport(cleanReport);
    expect(decision.verdict).toBe("ALLOW");
  });

  it("maps ALLOW with human-approval notification to WARN", () => {
    const decision = transformScenarioReport(remediationReport);
    expect(decision.verdict).toBe("WARN");
  });

  it("uses scenario_id as the decision id", () => {
    const decision = transformScenarioReport(litellmReport);
    expect(decision.id).toBe("scenario-b-litellm-risk");
  });

  it("maps evidence to signals", () => {
    const decision = transformScenarioReport(litellmReport);
    expect(decision.signals).toEqual(["flagged_dependency_version", "reads_env_vars", "reads_ssh_keys"]);
  });

  it("generates thread_id from scenario_id", () => {
    const decision = transformScenarioReport(litellmReport);
    expect(decision.thread_id).toBe("thread-scenario-b-litellm-risk");
  });

  it("includes agent info in provenance", () => {
    const decision = transformScenarioReport(litellmReport);
    expect(decision.provenance).toContain("Sandbox Runner");
    expect(decision.provenance).toContain("unknown");
  });

  it("maps file_read action type to api_request", () => {
    const decision = transformScenarioReport(cleanReport);
    expect(decision.action_type).toBe("api_request");
  });

  it("maps package_install action type directly", () => {
    const decision = transformScenarioReport(litellmReport);
    expect(decision.action_type).toBe("package_install");
  });

  it("marks high/critical severity as real attack", () => {
    const decision = transformScenarioReport(litellmReport);
    expect(decision.is_real_attack).toBe(true);
  });

  it("does not mark info severity as real attack", () => {
    const decision = transformScenarioReport(cleanReport);
    expect(decision.is_real_attack).toBe(false);
  });
});

describe("transformScenarioTrace", () => {
  it("converts trace events into Thread messages", () => {
    const thread = transformScenarioTrace(litellmTrace, litellmReport);
    expect(thread.messages.length).toBe(4); // 3 events + 1 notification
  });

  it("maps agent.registered to system role", () => {
    const thread = transformScenarioTrace(litellmTrace, litellmReport);
    expect(thread.messages[0].role).toBe("system");
  });

  it("maps action.requested to user role", () => {
    const thread = transformScenarioTrace(litellmTrace, litellmReport);
    expect(thread.messages[1].role).toBe("user");
  });

  it("maps decision.block to assistant role", () => {
    const thread = transformScenarioTrace(litellmTrace, litellmReport);
    expect(thread.messages[2].role).toBe("assistant");
  });

  it("appends notifications as tool messages", () => {
    const thread = transformScenarioTrace(litellmTrace, litellmReport);
    const lastMsg = thread.messages[3];
    expect(lastMsg.role).toBe("tool");
    expect(lastMsg.content).toContain("human-approval-queue");
  });

  it("generates correct thread id", () => {
    const thread = transformScenarioTrace(litellmTrace, litellmReport);
    expect(thread.id).toBe("thread-scenario-b-litellm-risk");
  });

  it("uses report agent_id", () => {
    const thread = transformScenarioTrace(litellmTrace, litellmReport);
    expect(thread.agent_id).toBe("agent-sandbox-risky");
  });
});

describe("transformScenarioEscalation", () => {
  it("returns an EscalationReport for scenarios with human-approval notifications", () => {
    const escalation = transformScenarioEscalation(litellmReport);
    expect(escalation).not.toBeNull();
    expect(escalation!.status).toBe("pending");
  });

  it("returns null for scenarios without human-approval notifications", () => {
    const escalation = transformScenarioEscalation(cleanReport);
    expect(escalation).toBeNull();
  });

  it("generates escalation ID matching dashboard convention", () => {
    const escalation = transformScenarioEscalation(litellmReport);
    // "litellm==1.82.8" → "esc-litellm-1-82-8"
    expect(escalation!.id).toBe("esc-litellm-1-82-8");
  });

  it("includes evidence in markdown body", () => {
    const escalation = transformScenarioEscalation(litellmReport);
    expect(escalation!.body_markdown).toContain("flagged_dependency_version");
    expect(escalation!.body_markdown).toContain("reads_env_vars");
  });

  it("includes agent info in markdown body", () => {
    const escalation = transformScenarioEscalation(litellmReport);
    expect(escalation!.body_markdown).toContain("Sandbox Runner");
    expect(escalation!.body_markdown).toContain("unknown");
  });

  it("includes depends_on in markdown for remediation scenario", () => {
    const escalation = transformScenarioEscalation(remediationReport);
    expect(escalation!.body_markdown).toContain("scenario-b-litellm-risk");
    expect(escalation!.body_markdown).toContain("Depends on");
  });

  it("maps reputation to score correctly", () => {
    // unknown reputation → 0.4
    const esc = transformScenarioEscalation(litellmReport);
    expect(esc!.signals.reputation_score).toBe(0.4);

    // trusted reputation → 0.9
    const escD = transformScenarioEscalation(remediationReport);
    expect(escD!.signals.reputation_score).toBe(0.9);
  });
});
