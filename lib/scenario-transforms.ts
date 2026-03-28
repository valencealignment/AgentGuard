import type { Decision, Thread, Message, EscalationReport, Verdict, ActionType } from "./types";

// ── Scenario report shape (from ops/reports/demo/scenario-*/report.json) ────

export interface ScenarioReport {
  scenario_id: string;
  title: string;
  summary: string;
  decision: string;
  severity: string;
  reason: string;
  evidence: string[];
  agent: {
    id: string;
    name: string;
    reputation: string;
    origin: string;
  };
  action: {
    type: string;
    target: string;
    context: Record<string, unknown>;
  };
  notifications: Array<{ channel: string; message: string }>;
  generated_at: string;
}

export interface ScenarioTrace {
  scenario_id: string;
  events: Array<{ type: string; summary: string }>;
  notifications: Array<{ channel: string; message: string }>;
  generated_at: string;
}

// ── Action type mapping ─────────────────────────────────────────────────

const ACTION_TYPE_MAP: Record<string, ActionType> = {
  package_install: "package_install",
  mcp_call: "mcp_call",
  api_request: "api_request",
  file_read: "api_request",
  agent_interaction: "api_request",
  report_generation: "api_request",
};

function mapActionType(raw: string): ActionType {
  return ACTION_TYPE_MAP[raw] ?? "api_request";
}

// ── Transform: scenario report → Decision ───────────────────────────────

export function transformScenarioReport(report: ScenarioReport): Decision {
  const hasHumanApproval = report.notifications.some(
    (n) => n.channel === "human-approval-queue",
  );

  // Scenarios with pending human approval are WARN/ESCALATE so the
  // escalation panel triggers in the dashboard.
  let verdict: Verdict = report.decision.toUpperCase() as Verdict;
  if (hasHumanApproval && verdict === "BLOCK") {
    verdict = "ESCALATE";
  } else if (hasHumanApproval && verdict === "ALLOW") {
    verdict = "WARN";
  }

  return {
    id: report.scenario_id,
    timestamp: report.generated_at,
    action_type: mapActionType(report.action.type),
    target: report.action.target,
    agent_id: report.agent.id,
    verdict,
    confidence: report.severity === "critical" ? 0.99 : report.severity === "high" ? 0.95 : 0.8,
    rules_triggered: [`scenario-validation:${report.scenario_id}`],
    signals: report.evidence,
    reason: report.reason,
    provenance: `${report.agent.name} (${report.agent.reputation}, ${report.agent.origin})`,
    thread_id: `thread-${report.scenario_id}`,
    duration_ms: 150,
    is_real_attack: report.severity === "high" || report.severity === "critical",
  };
}

// ── Transform: scenario trace → Thread ──────────────────────────────────

const EVENT_ROLE_MAP: Record<string, Message["role"]> = {
  "agent.registered": "system",
  "action.requested": "user",
  "decision.allow": "assistant",
  "decision.block": "assistant",
  "decision.escalate": "assistant",
  "decision.warn": "assistant",
};

export function transformScenarioTrace(
  trace: ScenarioTrace,
  report: ScenarioReport,
): Thread {
  const baseTime = new Date(trace.generated_at).getTime();

  const messages: Message[] = trace.events.map((event, i) => ({
    role: EVENT_ROLE_MAP[event.type] ?? "tool",
    content: event.summary,
    timestamp: new Date(baseTime + i * 1000).toISOString(),
  }));

  // Append notification messages as tool outputs
  for (const notification of trace.notifications) {
    messages.push({
      role: "tool",
      content: `[${notification.channel}] ${notification.message}`,
      timestamp: new Date(baseTime + messages.length * 1000).toISOString(),
    });
  }

  return {
    id: `thread-${trace.scenario_id}`,
    agent_id: report.agent.id,
    created_at: trace.generated_at,
    messages,
  };
}

// ── Transform: scenario notifications → EscalationReport ────────────────

export function transformScenarioEscalation(
  report: ScenarioReport,
): EscalationReport | null {
  const approvalNotification = report.notifications.find(
    (n) => n.channel === "human-approval-queue",
  );
  if (!approvalNotification) return null;

  // Build escalation ID the same way the dashboard does
  const escId = `esc-${report.action.target
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()}`;

  const severityToConfidence: Record<string, number> = {
    critical: 0.99,
    high: 0.95,
    warning: 0.8,
    info: 0.6,
  };

  return {
    id: escId,
    target: report.action.target,
    version: "",
    generated_by: report.agent.name,
    timestamp: report.generated_at,
    body_markdown: buildEscalationMarkdown(report, approvalNotification.message),
    signals: {
      reputation_score: report.agent.reputation === "trusted" ? 0.9 : report.agent.reputation === "unknown" ? 0.4 : 0.1,
      confidence: severityToConfidence[report.severity] ?? 0.7,
      threshold: 0.65,
    },
    status: "pending",
  };
}

function buildEscalationMarkdown(
  report: ScenarioReport,
  approvalMessage: string,
): string {
  const lines = [
    `## ${report.title}`,
    "",
    report.summary,
    "",
    "**Evidence:**",
    ...report.evidence.map((e) => `- \`${e}\``),
    "",
    `**Agent:** ${report.agent.name} (reputation: ${report.agent.reputation}, origin: ${report.agent.origin})`,
    "",
    `**Action:** ${report.action.type} → \`${report.action.target}\``,
    "",
    `**Severity:** ${report.severity}`,
    "",
    `**Pending Review:** ${approvalMessage}`,
  ];

  // Show dependency chain if present
  const dependsOn = report.action.context?.depends_on;
  if (dependsOn) {
    lines.push("", `**Depends on:** \`${dependsOn}\` — this action follows a prior block decision.`);
  }

  return lines.join("\n");
}
