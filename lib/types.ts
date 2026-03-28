export type Verdict = "BLOCK" | "ALLOW" | "ESCALATE" | "WARN";

export type ActionType = "package_install" | "mcp_call" | "api_request";

export interface AgentVerdict {
  agent: string;
  finding: string;
  confidence: number;
}

export interface Decision {
  id: string;
  timestamp: string;
  action_type: ActionType;
  target: string;
  agent_id: string;
  verdict: Verdict;
  confidence: number;
  rules_triggered: string[];
  signals: string[];
  reason: string;
  provenance: string;
  thread_id: string;
  duration_ms: number;
  is_real_attack: boolean;
  agent_verdicts?: AgentVerdict[];
  pypi_status?: "available" | "yanked" | "unknown";
  version?: string;
  advisory_md?: string;
}

// Thread & Message interfaces
export interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: string;
  tool_calls?: { name: string; args: string }[];
}

export interface Thread {
  id: string;
  messages: Message[];
  created_at: string;
  agent_id: string;
}

// AutoResearcher iteration
export interface Iteration {
  id: string;
  label: string;
  score: number;
  delta: number;
  mutation: string;
  timestamp: string;
  kept: boolean;
}

// Escalation report
export interface EscalationReport {
  id: string;
  target: string;
  version: string;
  generated_by: string;
  timestamp: string;
  body_markdown: string;
  signals: {
    reputation_score: number;
    confidence: number;
    threshold: number;
  };
  status: "pending" | "approved" | "denied";
}

// Score response from /api/score
export interface ScoreResponse {
  policy_score: number;
  catch_rate: number;
  fp_rate: number;
  total_evaluated: number;
  total_blocked: number;
  total_allowed: number;
  total_escalated: number;
}

// Threat Intel: exposed instance
export interface ExposedInstance {
  id: string;
  ip: string;
  hostname: string;
  cloud: string;
  region: string;
  lat: number;
  lng: number;
  asn: string;
  version: string;
  cves: string[];
  epss_max: number;
  apts: string[];
  risk_score: number;
  auth_status: "AUTH_DISABLED" | "WEAK_AUTH" | "AUTH_OK";
  exposed_since: string;
  credential_leaks?: string[];
  notes: string;
  enforcement_ref?: string;
  mcp_flags?: Record<string, boolean>;
}

// CVE detail (pre-cached)
export interface CveDetail {
  id: string;
  cvss: number;
  epss: number;
  summary: string;
}

// Package lookup result
export interface PackageLookupResult {
  name: string;
  version: string;
  license: string;
  dep_count: number;
  cves: CveDetail[];
  risk_score: number;
  verdict: Verdict;
}
