import type { Decision, Iteration, ScoreResponse, Verdict } from "./types";

// ── Backend response shapes (what the FastAPI guard returns) ─────────────

export interface GuardCheckResponse {
  ok: boolean;
  timestamp: string;
  verdict: string;       // lowercase: "block" | "allow" | "warn"
  reason: string;
  risk_score: number;
  action: {
    id: string;
    action_type: string;
    target: string;
    signals: string[];
  };
}

export interface GuardLogRecord {
  timestamp: string;
  iteration: number;
  accuracy: number;
  f1_score: number;
  catch_rate: number;
  false_pos_rate: number;
  mutation: string;
  mutation_category: string;
  result: "kept" | "reverted";
  remaining_mistakes: string[];
}

export interface GuardMetricsResponse {
  f1_score: number;
  catch_rate: number;
  false_pos_rate: number;
  total_iterations: number;
  best_f1: number;
}

// ── Transform functions ─────────────────────────────────────────────────

export function transformVerdict(v: string): Verdict {
  const upper = v.toUpperCase();
  if (upper === "BLOCK" || upper === "ALLOW" || upper === "WARN" || upper === "ESCALATE") {
    return upper;
  }
  return "BLOCK";
}

export function transformLogRecords(records: GuardLogRecord[]): Iteration[] {
  let prevScore = 0;
  return records.map((rec, index) => {
    const score = Math.round(rec.f1_score * 100);
    const delta = index === 0 ? 0 : score - prevScore;
    prevScore = score;
    return {
      id: `iter-${rec.iteration}`,
      label: rec.iteration === 0 ? "baseline" : `iter-${rec.iteration}`,
      score,
      delta,
      mutation: rec.mutation,
      timestamp: rec.timestamp,
      kept: rec.result === "kept",
    };
  });
}

export function transformMetrics(m: GuardMetricsResponse): ScoreResponse {
  return {
    policy_score: Math.round(m.best_f1 * 100),
    catch_rate: m.catch_rate,
    fp_rate: m.false_pos_rate,
    total_evaluated: m.total_iterations,
    total_blocked: 0,   // not available from /metrics — filled by decision counts
    total_allowed: 0,
    total_escalated: 0,
  };
}

export function transformCheckResult(r: GuardCheckResponse): Partial<Decision> {
  return {
    id: `live-${Date.now()}`,
    timestamp: r.timestamp,
    action_type: r.action.action_type as Decision["action_type"],
    target: r.action.target,
    verdict: transformVerdict(r.verdict),
    confidence: r.risk_score / 100,
    rules_triggered: [r.reason],
    signals: r.action.signals,
    reason: r.reason,
    provenance: "live-guard",
    thread_id: "",
    duration_ms: 0,
    is_real_attack: false,
  };
}

/** Transform a persisted live verdict record into a full Decision for the enforcement log. */
export function transformLiveVerdict(r: GuardCheckResponse, index: number): Decision {
  // Stable ID from timestamp so dedup works across polls
  const slug = r.action.target.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return {
    id: `live-${slug}-${index}`,
    timestamp: r.timestamp,
    action_type: (r.action.action_type === "package_install" || r.action.action_type === "mcp_call" || r.action.action_type === "api_request")
      ? r.action.action_type
      : "api_request",
    target: r.action.target,
    agent_id: "live-demo",
    verdict: transformVerdict(r.verdict),
    confidence: Math.max(0.01, Math.min(1, r.risk_score / 100)),
    rules_triggered: [r.reason],
    signals: r.action.signals ?? [],
    reason: r.reason,
    provenance: "live-guard",
    thread_id: "",
    duration_ms: 0,
    is_real_attack: false,
    is_live: true,
  };
}
