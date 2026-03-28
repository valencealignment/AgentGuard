import type { EscalationReport } from "./types";
import { transformScenarioEscalation, type ScenarioReport } from "./scenario-transforms";

// Scenario reports are loaded lazily and cached. In a real deployment these
// would come from the scenario runner artifacts on disk; here we inline the
// data so the module works in both Node and edge environments.
const SCENARIO_REPORTS: ScenarioReport[] = [
  {
    scenario_id: "scenario-b-litellm-risk",
    title: "LiteLLM-centered risky path",
    summary: "A sandboxed agent attempts to install a flagged LiteLLM version associated with suspicious install-time behavior.",
    decision: "BLOCK",
    severity: "high",
    reason: "Flagged dependency version and suspicious install-time signals require immediate blocking.",
    evidence: ["flagged_dependency_version", "reads_env_vars", "reads_ssh_keys", "opens_network_socket_during_install"],
    agent: { id: "agent-sandbox-risky", name: "Sandbox Runner", reputation: "unknown", origin: "sandbox" },
    action: { type: "package_install", target: "litellm==1.82.8", context: { workspace_only: false, network_required: true, package_install: true } },
    notifications: [{ channel: "human-approval-queue", message: "Review flagged LiteLLM installation attempt and verify safe replacement guidance." }],
    generated_at: "2026-03-28T12:58:21-07:00",
  },
  {
    scenario_id: "scenario-c-poor-reputation-external-agent",
    title: "Poor-reputation external agent interaction",
    summary: "A low-reputation external agent attempts to invoke our system with weak provenance and outbound notification side effects.",
    decision: "BLOCK",
    severity: "critical",
    reason: "External low-reputation agent lacks trusted provenance and requested unsafe side effects.",
    evidence: ["poor_reputation", "unsigned_provenance", "network_side_effect_requested"],
    agent: { id: "agent-external-lowrep", name: "External Plugin Runner", reputation: "poor", origin: "external" },
    action: { type: "agent_interaction", target: "notify-and-install", context: { workspace_only: false, network_required: true, provenance: "unsigned" } },
    notifications: [
      { channel: "security-alerts", message: "Blocked poor-reputation external agent before side effects executed." },
      { channel: "human-approval-queue", message: "Review external agent trust posture before allowing future interactions." },
    ],
    generated_at: "2026-03-28T12:58:21-07:00",
  },
  {
    scenario_id: "scenario-d-remediation-follow-through",
    title: "Remediation follow-through support",
    summary: "A blocked dependency path produces follow-up artifacts that explain remediation and support downstream advisory generation.",
    decision: "ALLOW",
    severity: "warning",
    reason: "Generating remediation guidance is safe and needed after the blocked scenario.",
    evidence: ["derived_from_block_event", "read_only_reporting", "human_review_required"],
    agent: { id: "agent-remediation", name: "Remediation Assistant", reputation: "trusted", origin: "internal" },
    action: { type: "report_generation", target: "litellm-remediation-brief", context: { workspace_only: true, depends_on: "scenario-b-litellm-risk" } },
    notifications: [{ channel: "human-approval-queue", message: "Approve publication of the LiteLLM remediation brief." }],
    generated_at: "2026-03-28T12:58:21-07:00",
  },
];

// Build scenario escalation reports and merge into the registry
const SCENARIO_ESCALATIONS: Record<string, EscalationReport> = {};
for (const report of SCENARIO_REPORTS) {
  const escalation = transformScenarioEscalation(report);
  if (escalation) {
    SCENARIO_ESCALATIONS[escalation.id] = escalation;
  }
}

export const MOCK_ESCALATIONS: Record<string, EscalationReport> = {
  // Scenario-derived escalations first
  ...SCENARIO_ESCALATIONS,
  // Then hand-crafted mock escalations (can override if IDs collide)
  "esc-numpy-1-24-0": {
    id: "esc-numpy-1-24-0",
    target: "numpy",
    version: "1.24.0",
    generated_by: "package-risk-agent",
    timestamp: "2026-03-28T14:32:11Z",
    body_markdown: `## Risk Assessment: numpy==1.24.0

This version of numpy has been flagged for escalation due to a combination of known vulnerabilities and version-specific concerns.

**CVE-2023-33733** (CVSS 7.5) affects numpy versions prior to 1.25.0. This vulnerability allows for denial-of-service via crafted input to the \`numpy.loadtxt\` function. The EPSS probability of exploitation is 0.72, indicating active exploitation in the wild.

Additionally, our analysis detected that version 1.24.0 is no longer receiving security patches. The numpy maintainers recommend upgrading to >= 1.25.2 for all production workloads.

**Recommendation**: Deny installation and require upgrade to numpy >= 1.25.2. If business requirements mandate 1.24.0, ensure input validation is applied to all numpy I/O operations.`,
    signals: {
      reputation_score: 0.42,
      confidence: 0.78,
      threshold: 0.65,
    },
    status: "pending",
  },

  "esc-ai-helper-toolkit-0-0-3": {
    id: "esc-ai-helper-toolkit-0-0-3",
    target: "ai-helper-toolkit",
    version: "0.1.3",
    generated_by: "package-risk-agent",
    timestamp: "2026-03-28T14:45:22Z",
    body_markdown: `## Risk Assessment: ai-helper-toolkit==0.1.3

This package has been flagged as a potential **slopsquat** — a package name generated by AI hallucination that was subsequently registered by a threat actor.

**Key indicators:**
- Package created 6 days ago (2026-03-22)
- Total downloads: 47 (suspiciously low)
- Single maintainer with no prior PyPI history
- No linked source repository
- Package description is generic and AI-generated

The package name "ai-helper-toolkit" matches patterns commonly hallucinated by LLMs when asked to suggest utility packages. Our analysis shows 3 distinct LLM families have generated this exact package name in code suggestions.

**Post-install behavior**: The package registers a \`post_install\` hook that downloads an obfuscated payload from a Cloudflare Workers endpoint. The payload attempts to exfiltrate environment variables and SSH keys.

**Recommendation**: Block immediately. This is a high-confidence slopsquat with confirmed malicious post-install behavior.`,
    signals: {
      reputation_score: 0.08,
      confidence: 0.94,
      threshold: 0.65,
    },
    status: "pending",
  },

  "esc-setuptools-75-0-0": {
    id: "esc-setuptools-75-0-0",
    target: "setuptools",
    version: "75.0.0",
    generated_by: "policy-agent",
    timestamp: "2026-03-28T15:01:44Z",
    body_markdown: `## Risk Assessment: setuptools==75.0.0

This escalation was triggered by a **version anomaly** detected in the setuptools package.

**Context**: The requesting agent specified setuptools==75.0.0, but the latest published version on PyPI is 69.5.1. Version 75.0.0 does not exist on the official PyPI registry.

**Possible scenarios:**
1. **Typo or hallucination**: The version number may have been generated by an LLM that extrapolated future version numbers
2. **Dependency confusion**: An attacker may have published setuptools==75.0.0 to a private registry that takes precedence over PyPI
3. **Supply chain attack**: The version could exist on a compromised mirror

Our policy engine flagged this because setuptools is a critical build-system dependency installed in virtually every Python environment. A compromised version could affect all downstream packages.

**Recommendation**: Deny this specific version. If setuptools needs updating, pin to the latest verified PyPI version (69.5.1).`,
    signals: {
      reputation_score: 0.31,
      confidence: 0.87,
      threshold: 0.65,
    },
    status: "pending",
  },

  "esc-http-192-168-1-50-8080-mcp": {
    id: "esc-http-192-168-1-50-8080-mcp",
    target: "192.168.1.50:8080/mcp",
    version: "",
    generated_by: "exposure-agent",
    timestamp: "2026-03-28T14:12:05Z",
    body_markdown: `## Exposure Warning: Internal MCP Endpoint

An MCP endpoint at \`192.168.1.50:8080\` on the internal network is reachable from the agent fleet with **no authentication**.

**Key findings:**
- All tools are publicly exposed with no access control
- No rate limiting configured
- No TLS — traffic is unencrypted on the internal network
- Endpoint has been reachable since at least 2026-02-15 (41 days)

**Risk assessment**: While no active exploitation has been detected, this configuration allows any agent with network access to invoke arbitrary tools. An agent compromised via supply-chain attack could use this endpoint for lateral movement.

**Recommendation**: Require authentication on the MCP endpoint and restrict tool exposure to only the tools needed by authorized agents.`,
    signals: {
      reputation_score: 0.35,
      confidence: 0.78,
      threshold: 0.85,
    },
    status: "pending",
  },
};

export function getEscalation(id: string): EscalationReport | undefined {
  return MOCK_ESCALATIONS[id];
}

export function updateEscalationStatus(
  id: string,
  status: "approved" | "denied"
): EscalationReport | undefined {
  const report = MOCK_ESCALATIONS[id];
  if (report) {
    report.status = status;
  }
  return report;
}
