import fs from "node:fs";
import path from "node:path";

import { getEscalation as getMockEscalation } from "@/lib/mock-escalations";
import type { ActionType, Decision, EscalationReport, Iteration, ScoreResponse, Verdict } from "@/lib/types";

const ROOT = process.cwd();
const OPS_DIR = path.join(ROOT, "ops");

type JsonRecord = Record<string, unknown>;

interface ScenarioReport {
  scenario_id: string;
  title: string;
  summary: string;
  decision: Verdict;
  severity: string;
  reason: string;
  evidence: string[];
  generated_at: string;
  agent: {
    id: string;
    name: string;
    reputation: string;
    origin: string;
  };
  action: {
    type: ActionType | string;
    target: string;
    context?: Record<string, unknown>;
  };
  notifications?: Array<{
    channel: string;
    message: string;
  }>;
}

interface SecurityResearch {
  generated_at: string;
  scenario_id: string;
  summary: string;
  evaluation: {
    verdict: Verdict;
    reason: string;
    risk_score: number;
    confidence: number;
    explanation: string;
    evidence: string[];
    signals: string[];
    package?: {
      name: string;
      version?: string;
    };
  };
  remediation?: string[];
}

interface WatchboardDecision {
  id: string;
  ts: string;
  type: string;
  title: string;
  summary: string;
  decision?: Verdict;
  severity?: string;
  scenario_id?: string;
}

interface MetricsPayload {
  generated_at?: string;
  metrics?: {
    catch_rate?: number;
    false_pos_rate?: number;
    f1_score?: number;
    tp?: number;
    tn?: number;
    fp?: number;
    fn?: number;
  };
  recent_results?: Array<{
    iteration: number;
    description?: string;
    mutation?: string;
    ts?: string;
    metrics?: {
      f1_score?: number;
    };
  }>;
}

function readJson<T>(relPath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), "utf8")) as T;
  } catch {
    return fallback;
  }
}

function readText(relPath: string, fallback = ""): string {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), "utf8");
  } catch {
    return fallback;
  }
}

function readJsonl<T>(relPath: string): T[] {
  try {
    const raw = fs.readFileSync(path.join(ROOT, relPath), "utf8").trim();
    if (!raw) return [];
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T);
  } catch {
    return [];
  }
}

function slugToEscalationId(target: string): string {
  return `esc-${target.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`;
}

function parsePackageTarget(target = ""): { name: string; version: string } {
  const [name = "", version = ""] = String(target).split("==");
  return { name: name.trim(), version: version.trim() };
}

function normalizeActionType(actionType: string | undefined): ActionType {
  switch (actionType) {
    case "package_install":
    case "mcp_call":
    case "api_request":
    case "file_read":
    case "agent_interaction":
    case "report_generation":
      return actionType;
    default:
      return "api_request";
  }
}

function loadScenarioReports(): Map<string, ScenarioReport> {
  const reports = new Map<string, ScenarioReport>();
  const baseDir = path.join(OPS_DIR, "reports", "demo");
  try {
    for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith("scenario-")) continue;
      const report = readJson<ScenarioReport>(
        path.join("ops", "reports", "demo", entry.name, "report.json"),
        null as never,
      );
      if (report?.scenario_id) {
        reports.set(report.scenario_id, report);
      }
    }
  } catch {
    // Ignore missing directory; callers will fall back to mock data.
  }
  return reports;
}

function loadSecurityResearch(): Map<string, SecurityResearch> {
  const research = new Map<string, SecurityResearch>();
  const baseDir = path.join(OPS_DIR, "reports", "security");
  try {
    for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith("-research.json")) continue;
      const payload = readJson<SecurityResearch>(
        path.join("ops", "reports", "security", entry.name),
        null as never,
      );
      if (payload?.scenario_id) {
        research.set(payload.scenario_id, payload);
      }
    }
  } catch {
    // Ignore missing directory; callers will fall back to mock data.
  }
  return research;
}

function loadWatchboardDecisions(): WatchboardDecision[] {
  const payload = readJson<{ decisions?: WatchboardDecision[] }>(
    path.join("ops", "watchboard-state.json"),
    {},
  );
  return Array.isArray(payload.decisions) ? payload.decisions : [];
}

function buildScenarioDecision(
  scenarioId: string,
  report: ScenarioReport,
  research?: SecurityResearch,
  watchboardDecisions: WatchboardDecision[] = [],
): Decision {
  const relatedEvents = watchboardDecisions.filter((entry) => entry.scenario_id === scenarioId);
  const latestEvent = relatedEvents.sort((a, b) => String(b.ts).localeCompare(String(a.ts)))[0];
  const parsedTarget = parsePackageTarget(report.action.target);
  const evidence = research?.evaluation?.evidence ?? report.evidence ?? [];
  const signals = research?.evaluation?.signals ?? report.action.context?.signals ?? evidence;
  const confidence = research?.evaluation?.confidence ?? (report.decision === "ALLOW" ? 0.95 : 0.88);
  const target = research?.evaluation?.package?.name
    ? `${research.evaluation.package.name}${research.evaluation.package.version ? `==${research.evaluation.package.version}` : ""}`
    : report.action.target;
  const timestamp = latestEvent?.ts ?? research?.generated_at ?? report.generated_at;
  const provenanceLines = [
    report.summary,
    research?.summary,
    report.notifications?.length
      ? `Notifications queued: ${report.notifications.map((item) => item.channel).join(", ")}.`
      : "",
  ].filter(Boolean);

  return {
    id: scenarioId,
    timestamp,
    action_type: normalizeActionType(report.action.type),
    target,
    agent_id: report.agent.id,
    verdict: research?.evaluation?.verdict ?? report.decision,
    confidence,
    rules_triggered: evidence,
    signals: Array.isArray(signals) ? signals.map(String) : [],
    reason: research?.evaluation?.reason ?? latestEvent?.summary ?? report.reason,
    provenance: provenanceLines.join(" "),
    thread_id: `thread-${scenarioId}`,
    duration_ms: 220 + evidence.length * 75,
    is_real_attack: scenarioId.includes("litellm"),
    agent_verdicts: [
      {
        agent: "demo-validation",
        finding: report.reason,
        confidence: report.decision === "ALLOW" ? 0.9 : 0.84,
      },
      {
        agent: "policy-engine",
        finding: research?.summary ?? latestEvent?.summary ?? report.summary,
        confidence,
      },
    ],
    pypi_status: scenarioId.includes("litellm") ? "yanked" : undefined,
    version: parsedTarget.version || research?.evaluation?.package?.version,
  };
}

function buildApprovalEscalationDecision(events: WatchboardDecision[]): Decision | null {
  const escalation = [...events]
    .filter((entry) => entry.type === "decision.escalate")
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)))[0];
  if (!escalation) return null;

  return {
    id: escalation.id,
    timestamp: escalation.ts,
    action_type: "report_generation",
    target: "litellm-advisory",
    agent_id: "security-research",
    verdict: "ESCALATE",
    confidence: 0.91,
    rules_triggered: ["human_approval_required", "advisory_publication_gate"],
    signals: ["blog_generated", "approval_required"],
    reason: escalation.summary,
    provenance:
      "The integrated security lane generated a public-facing advisory, but publication remains behind an explicit approval checkpoint.",
    thread_id: "thread-litellm-advisory",
    duration_ms: 180,
    is_real_attack: false,
    agent_verdicts: [
      {
        agent: "research-engine",
        finding: "Advisory content is complete and ready for human review.",
        confidence: 0.93,
      },
      {
        agent: "notification-lane",
        finding: "Publication remains gated until review is recorded.",
        confidence: 0.89,
      },
    ],
  };
}

export function loadDecisions(): Decision[] {
  const scenarioReports = loadScenarioReports();
  const researchMap = loadSecurityResearch();
  const watchboardDecisions = loadWatchboardDecisions();
  const scenarioIds = new Set<string>([
    ...scenarioReports.keys(),
    ...watchboardDecisions
      .map((entry) => entry.scenario_id)
      .filter((value): value is string => Boolean(value)),
  ]);

  const decisions: Decision[] = [];
  for (const scenarioId of scenarioIds) {
    const report = scenarioReports.get(scenarioId);
    if (!report) continue;
    decisions.push(buildScenarioDecision(scenarioId, report, researchMap.get(scenarioId), watchboardDecisions));
  }

  const approvalDecision = buildApprovalEscalationDecision(watchboardDecisions);
  if (approvalDecision) {
    decisions.push(approvalDecision);
  }

  return decisions.sort((left, right) => {
    if (left.is_real_attack && !right.is_real_attack) return -1;
    if (!left.is_real_attack && right.is_real_attack) return 1;
    return String(right.timestamp).localeCompare(String(left.timestamp));
  });
}

export function loadScore(): ScoreResponse {
  const metricsPayload = readJson<MetricsPayload>(
    path.join("ops", "reports", "security", "metrics.json"),
    {},
  );
  const decisions = loadDecisions();
  const totalBlocked = decisions.filter((entry) => entry.verdict === "BLOCK").length;
  const totalAllowed = decisions.filter((entry) => entry.verdict === "ALLOW").length;
  const totalEscalated = decisions.filter(
    (entry) => entry.verdict === "ESCALATE" || entry.verdict === "WARN",
  ).length;
  const metrics = metricsPayload.metrics ?? {};

  return {
    policy_score: Math.round((metrics.f1_score ?? 0.85) * 100),
    catch_rate: metrics.catch_rate ?? 0.9,
    fp_rate: metrics.false_pos_rate ?? 0.04,
    total_evaluated: (metrics.tp ?? 0) + (metrics.tn ?? 0) + (metrics.fp ?? 0) + (metrics.fn ?? 0),
    total_blocked: totalBlocked,
    total_allowed: totalAllowed,
    total_escalated: totalEscalated,
  };
}

export function loadIterations(): Iteration[] {
  const rows = readJsonl<{
    iteration?: number;
    description?: string;
    mutation?: string;
    ts?: string;
    metrics?: {
      f1_score?: number;
    };
  }>("merck_results.jsonl");

  const byIteration = new Map<number, Iteration>();
  let previousScore = 0;

  for (const row of rows.sort((a, b) => Number(a.iteration ?? 0) - Number(b.iteration ?? 0))) {
    const iterationNumber = Number(row.iteration ?? 0);
    if (!iterationNumber) continue;
    const score = Math.round((row.metrics?.f1_score ?? 0) * 100);
    byIteration.set(iterationNumber, {
      id: `iter-${iterationNumber}`,
      label: `iter-${iterationNumber}`,
      score,
      delta: score - previousScore,
      mutation: row.description ?? row.mutation ?? "MERCK policy refinement",
      timestamp: row.ts ?? new Date().toISOString(),
    });
    previousScore = score;
  }

  if (byIteration.size > 0) {
    return [...byIteration.values()];
  }

  return [
    {
      id: "iter-baseline",
      label: "baseline",
      score: 85,
      delta: 0,
      mutation: "Fallback baseline while integrated MERCK artifacts load.",
      timestamp: new Date().toISOString(),
    },
  ];
}

export function previewNextIteration(): Iteration {
  const iterations = loadIterations();
  const last = iterations[iterations.length - 1];
  const nextIndex = iterations.length + 1;
  const nextScore = Math.min(99, last.score + (last.score >= 98 ? 0 : 1));

  return {
    id: `iter-preview-${nextIndex}`,
    label: `iter-${nextIndex}`,
    score: nextScore,
    delta: nextScore - last.score,
    mutation: "Preview: tighten advisory publication gates without regressing the clean-allow path.",
    timestamp: new Date().toISOString(),
  };
}

function buildIntegratedEscalation(id: string): EscalationReport | undefined {
  const advisoryBody =
    readText(path.join("ops", "reports", "security", "litellm-remediation-brief.md")) ||
    readText(path.join("ops", "reports", "blogs", "litellm-advisory.md"));
  const metricsPayload = readJson<MetricsPayload>(
    path.join("ops", "reports", "security", "metrics.json"),
    {},
  );
  const confidence = metricsPayload.metrics?.f1_score ?? 0.91;

  if (id === slugToEscalationId("litellm-advisory") && advisoryBody) {
    return {
      id,
      target: "litellm-advisory",
      version: "1.82.7 / 1.82.8",
      generated_by: "security-research",
      timestamp: metricsPayload.generated_at ?? new Date().toISOString(),
      body_markdown: advisoryBody,
      signals: {
        reputation_score: 0.18,
        confidence,
        threshold: 0.85,
      },
      status: "pending",
    };
  }

  const scenarioMap = loadScenarioReports();
  const researchMap = loadSecurityResearch();
  for (const report of scenarioMap.values()) {
    const escalationId = slugToEscalationId(report.action.target || report.title);
    if (escalationId !== id) continue;
    const research = researchMap.get(report.scenario_id);
    return {
      id,
      target: report.action.target,
      version: parsePackageTarget(report.action.target).version,
      generated_by: "waal-integration",
      timestamp: research?.generated_at ?? report.generated_at,
      body_markdown: [report.summary, research?.summary, ...(research?.remediation ?? [])]
        .filter(Boolean)
        .join("\n\n"),
      signals: {
        reputation_score: report.agent.reputation === "poor" ? 0.18 : 0.46,
        confidence: research?.evaluation?.confidence ?? 0.76,
        threshold: 0.7,
      },
      status: "pending",
    };
  }

  return undefined;
}

export function loadEscalation(id: string): EscalationReport | undefined {
  return buildIntegratedEscalation(id) ?? getMockEscalation(id);
}

export function reviewEscalation(id: string, action: "approve" | "deny"): EscalationReport | undefined {
  const report = loadEscalation(id);
  if (!report) return undefined;
  return {
    ...report,
    status: action === "approve" ? "approved" : "denied",
  };
}

export function loadThreadSummaries(): JsonRecord[] {
  return loadDecisions().map((decision) => ({
    id: decision.thread_id,
    decision_id: decision.id,
    target: decision.target,
    verdict: decision.verdict,
    reason: decision.reason,
  }));
}
