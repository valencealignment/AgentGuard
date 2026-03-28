import type { Decision } from "./types";

// Agent-generated advisory — this content was produced by the MERCK research agent,
// not hand-written. Inlined here for mock fallback; the live path reads from
// ops/reports/blogs/litellm-supply-chain-advisory.md via /api/autoresearcher/advisory.
const LITELLM_ADVISORY = `# LiteLLM Supply-Chain Advisory

## Summary

The WAASL MERCK corpus treats \`litellm==1.82.7\` and \`litellm==1.82.8\` as
malicious package-install events. In this scenario, the installer behavior is
high risk because it combines credential access with execution behavior that is
not required for a normal dependency install.

## Observed Behaviors

- Reads SSH keys during install.
- Reads environment variables during install.
- Spawns child processes during install.

Those signals are strong supply-chain indicators because they create a direct
path from package install to credential theft, environment discovery, and
follow-on execution.

## Operational Impact

- Developer workstations can leak SSH material or API secrets.
- CI runners can expose environment-scoped credentials.
- A compromised dependency can pivot into internal services by reusing the
  captured secrets during the same install window.

## Current WAASL Response

- Blocks exact bad versions of LiteLLM in \`waasl-rules.yaml\`.
- Keeps \`litellm==1.82.6\` allowed to avoid over-blocking known safe installs.
- Adds a generated regression test for \`litellm==1.82.9\` with an expected
  \`warn\` verdict so adjacent versions are reviewed before promotion.

## Recommended Actions

- Freeze dependency resolution and pin to known-safe versions.
- Rotate any credentials exposed on hosts that installed the affected versions.
- Review build logs for package-install network activity and child-process
  execution.
- Require package provenance review before approving adjacent LiteLLM releases.

## Detection Notes

The current MERCK policy is tuned to preserve \`f1 >= 0.98\` while pushing false
positives toward \`0.0\`. That means exact malicious versions stay blocked, known
safe versions stay allowed, and newly suspicious neighboring versions are
surfaced as warnings until confirmed.`;

export const mockMaliciousDecisions: Decision[] = [
  {
    id: "litellm-supply-chain",
    timestamp: "2026-03-28T09:14:33Z",
    action_type: "package_install",
    target: "litellm==1.82.8",
    agent_id: "codex-agent-07",
    verdict: "BLOCK",
    confidence: 1.0,
    rules_triggered: ["supply-chain-attack-detected-v3.1"],
    signals: [
      "reads_ssh_keys",
      "reads_env_vars",
      "spawns_child_processes",
      "k8s_lateral_movement",
      "network_exfiltration",
    ],
    reason:
      "confirmed supply-chain attack — malicious .pth, PyPI quarantined",
    provenance:
      "litellm 1.82.8 contains litellm_init.pth — executes on every Python startup. Harvests SSH keys, cloud credentials (.env, GCP ADC, AWS keys, K8s configs), exfiltrates to models.litellm.cloud via AES-256-CBC encrypted payload. If K8s service account present: reads all cluster secrets across all namespaces, attempts to create privileged alpine:latest pods on every node in kube-system. Reported to PyPI by FutureSearch 2026-03-24. Package quarantined same day.",
    thread_id: "thread-litellm-182-8",
    duration_ms: 1200,
    is_real_attack: true,
    pypi_status: "yanked",
    advisory_md: LITELLM_ADVISORY,
  },
  {
    id: "litellm-also-bad",
    timestamp: "2026-03-28T09:14:35Z",
    action_type: "package_install",
    target: "litellm==1.82.7",
    agent_id: "codex-agent-04",
    verdict: "BLOCK",
    confidence: 1.0,
    rules_triggered: ["supply-chain-attack-detected-v3.1"],
    signals: [
      "reads_ssh_keys",
      "reads_env_vars",
      "spawns_child_processes",
    ],
    reason:
      "also compromised — same supply-chain attack campaign as 1.82.8",
    provenance:
      "litellm 1.82.7 contains the same litellm_init.pth payload as 1.82.8. Same exfiltration infrastructure at models.litellm.cloud. Part of a multi-version supply-chain attack campaign. PyPI quarantined both versions on 2026-03-24.",
    thread_id: "thread-litellm-182-7",
    duration_ms: 980,
    is_real_attack: true,
    pypi_status: "yanked",
  },
  {
    id: "typosquat-litelm",
    timestamp: "2026-03-28T09:15:12Z",
    action_type: "package_install",
    target: "litelm==1.82.8",
    agent_id: "codex-agent-02",
    verdict: "BLOCK",
    confidence: 0.97,
    rules_triggered: ["typosquat-detection-v2"],
    signals: ["typosquat", "zero_downloads", "no_maintainer_history"],
    reason: "typosquat of litellm — single character deletion",
    provenance:
      "Package name 'litelm' is a single-deletion typosquat of 'litellm'. Zero downloads, no verified maintainer. Registered within 48 hours of the litellm supply-chain disclosure.",
    thread_id: "thread-litelm",
    duration_ms: 340,
    is_real_attack: false,
  },
  {
    id: "typosquat-llitellm",
    timestamp: "2026-03-28T09:15:45Z",
    action_type: "package_install",
    target: "llitellm==1.82.8",
    agent_id: "codex-agent-09",
    verdict: "BLOCK",
    confidence: 0.96,
    rules_triggered: ["typosquat-detection-v2"],
    signals: ["typosquat", "zero_downloads", "new_package"],
    reason: "typosquat of litellm — doubled initial character",
    provenance:
      "Package name 'llitellm' is a character-doubling typosquat of 'litellm'. Zero downloads, created 2026-03-25. Likely opportunistic squatting following the litellm disclosure.",
    thread_id: "thread-llitellm",
    duration_ms: 290,
    is_real_attack: false,
  },
  {
    id: "typosquat-litellmm",
    timestamp: "2026-03-28T09:16:18Z",
    action_type: "package_install",
    target: "litellmm==0.1.0",
    agent_id: "codex-agent-11",
    verdict: "BLOCK",
    confidence: 0.95,
    rules_triggered: ["typosquat-detection-v2"],
    signals: ["typosquat", "zero_downloads", "no_maintainer_history"],
    reason: "typosquat of litellm — doubled trailing character",
    provenance:
      "Package name 'litellmm' is a trailing-character-doubling typosquat of 'litellm'. Zero downloads, unverified publisher.",
    thread_id: "thread-litellmm",
    duration_ms: 310,
    is_real_attack: false,
  },
  {
    id: "suspicious-new-pkg",
    timestamp: "2026-03-28T09:14:41Z",
    action_type: "package_install",
    target: "ai-helper-toolkit==0.0.3",
    agent_id: "codex-agent-09",
    verdict: "ESCALATE",
    confidence: 0.68,
    rules_triggered: ["slopsquat-detection-v1", "new-package-risk-v2"],
    signals: ["new_package", "no_maintainer_history", "zero_downloads"],
    reason:
      "new package, no maintainer history — confidence 68%, escalating",
    provenance:
      "Package name 'ai-helper-toolkit' matches AI-generated naming patterns. Zero downloads, registered 2026-03-26. Confidence below auto-block threshold (85%), escalating for human review.",
    thread_id: "thread-ai-helper",
    duration_ms: 520,
    is_real_attack: false,
  },
  {
    id: "slopsquat-ml-model-utils",
    timestamp: "2026-03-28T09:17:10Z",
    action_type: "package_install",
    target: "ml-model-utils==0.0.1",
    agent_id: "codex-agent-04",
    verdict: "BLOCK",
    confidence: 0.89,
    rules_triggered: ["slopsquat-detection-v1"],
    signals: [
      "slopsquat",
      "ai_generated_name",
      "zero_downloads",
      "new_package",
    ],
    reason:
      "slopsquat — AI-generated name, zero downloads, no source repository",
    provenance:
      "Package name 'ml-model-utils' follows AI code-generation naming conventions. No linked source repository, no maintainer history, 0 downloads since publish.",
    thread_id: "thread-ml-model-utils",
    duration_ms: 410,
    is_real_attack: false,
  },
  {
    id: "malicious-mcp-proxy",
    timestamp: "2026-03-28T09:16:02Z",
    action_type: "mcp_call",
    target: "npm:mcp-proxy-server@1.0.0",
    agent_id: "codex-agent-09",
    verdict: "BLOCK",
    confidence: 0.95,
    rules_triggered: ["mcp-exfil-detection-v1"],
    signals: ["exfiltrates_mail_content", "unauthorized_data_access"],
    reason:
      "malicious MCP server — proxies all tool calls through attacker-controlled endpoint",
    provenance:
      "MCP server 'mcp-proxy-server' intercepts all tool call payloads and forwards them to an external endpoint before returning results. Effectively a man-in-the-middle on all agent tool use.",
    thread_id: "thread-mcp-proxy",
    duration_ms: 680,
    is_real_attack: false,
  },
  {
    id: "malicious-mcp-auth-bypass",
    timestamp: "2026-03-28T09:17:30Z",
    action_type: "mcp_call",
    target: "npm:mcp-auth-bypass@0.5.0",
    agent_id: "codex-agent-02",
    verdict: "BLOCK",
    confidence: 0.93,
    rules_triggered: ["mcp-privilege-escalation-v1"],
    signals: [
      "privilege_escalation",
      "auth_bypass",
      "reads_env_vars",
    ],
    reason:
      "malicious MCP server — bypasses auth checks and escalates agent privileges",
    provenance:
      "MCP server 'mcp-auth-bypass' modifies tool call context to strip authentication headers and inject elevated permissions. Reads environment variables to harvest API keys.",
    thread_id: "thread-mcp-auth-bypass",
    duration_ms: 550,
    is_real_attack: false,
  },
  {
    id: "behavioral-bad",
    timestamp: "2026-03-28T09:14:58Z",
    action_type: "package_install",
    target: "data-processor==2.1.0",
    agent_id: "codex-agent-11",
    verdict: "BLOCK",
    confidence: 0.93,
    rules_triggered: ["behavioral-analysis-v3"],
    signals: [
      "opens_network_socket_during_install",
      "reads_env_vars",
    ],
    reason: "opens network socket during install + reads env vars",
    provenance:
      "Package 'data-processor' 2.1.0 setup.py opens a network socket to telemetry.dpkg.io during installation and reads all environment variables. Behavioral sandbox flagged both actions as anomalous.",
    thread_id: "thread-data-processor",
    duration_ms: 890,
    is_real_attack: false,
  },
  {
    id: "exfil-domain",
    timestamp: "2026-03-28T09:17:55Z",
    action_type: "api_request",
    target: "https://collect-data.evil.com/api/v1/upload",
    agent_id: "codex-agent-04",
    verdict: "BLOCK",
    confidence: 1.0,
    rules_triggered: ["known-exfil-domain-v4"],
    signals: ["known_exfil_domain", "data_upload_endpoint"],
    reason:
      "known data exfiltration domain — blocked at network policy layer",
    provenance:
      "Domain 'collect-data.evil.com' is on the threat intelligence blocklist. Flagged by multiple feeds as a data exfiltration endpoint. Agent attempted to upload data via POST to /api/v1/upload.",
    thread_id: "thread-exfil-domain",
    duration_ms: 120,
    is_real_attack: false,
  },
  {
    id: "numpy-uncertain",
    timestamp: "2026-03-28T09:17:21Z",
    action_type: "package_install",
    target: "numpy==1.24.0",
    agent_id: "codex-agent-11",
    verdict: "ESCALATE",
    confidence: 0.71,
    rules_triggered: ["post-install-analysis-v2"],
    signals: ["post_install_hook", "new_domain", "unverified_telemetry"],
    reason:
      "post-install hook calls domain <14d old — confidence 71%, escalating",
    provenance:
      "numpy 1.24.0 post-install hook makes an outbound network call to telemetry.np-stats.io — a domain registered 14 days ago with no verifiable affiliation to the NumPy project. Confidence below auto-block threshold (85%), escalating for human review.",
    thread_id: "thread-numpy-uncertain",
    duration_ms: 750,
    is_real_attack: false,
  },
  {
    id: "exposed-mcp",
    timestamp: "2026-03-28T09:14:48Z",
    action_type: "mcp_call",
    target: "http://192.168.1.50:8080/mcp",
    agent_id: "codex-agent-02",
    verdict: "WARN",
    confidence: 0.78,
    rules_triggered: ["exposed-endpoint-v1", "no-auth-v2"],
    signals: ["exposed_endpoint", "no_auth", "internal_network"],
    reason:
      "exposed MCP endpoint on internal network without authentication",
    provenance:
      "MCP endpoint at 192.168.1.50:8080 is reachable from the agent network with no authentication. All tools are publicly exposed. Rated as WARN because no active exploitation detected, but configuration is dangerous.",
    thread_id: "thread-exposed-mcp",
    duration_ms: 340,
    is_real_attack: false,
  },
];

export const mockCleanDecisions: Decision[] = [
  {
    id: "clean-httpx",
    timestamp: "2026-03-28T09:18:10Z",
    action_type: "package_install",
    target: "httpx==0.27.0",
    agent_id: "codex-agent-04",
    verdict: "ALLOW",
    confidence: 0.99,
    rules_triggered: [],
    signals: [],
    reason: "trusted package — verified maintainer, 12M+ downloads",
    provenance:
      "httpx 0.27.0 is a well-established HTTP client library. Verified maintainer (encode), consistent release history, no behavioral anomalies detected.",
    thread_id: "thread-httpx",
    duration_ms: 180,
    is_real_attack: false,
  },
  {
    id: "clean-pydantic",
    timestamp: "2026-03-28T09:18:25Z",
    action_type: "package_install",
    target: "pydantic==2.5.0",
    agent_id: "codex-agent-07",
    verdict: "ALLOW",
    confidence: 0.99,
    rules_triggered: [],
    signals: [],
    reason: "trusted package — verified maintainer, 50M+ downloads",
    provenance:
      "pydantic 2.5.0 is a widely-used data validation library. Verified maintainer (samuel colvin), no supply-chain indicators.",
    thread_id: "thread-pydantic",
    duration_ms: 150,
    is_real_attack: false,
  },
  {
    id: "clean-fastapi",
    timestamp: "2026-03-28T09:18:40Z",
    action_type: "package_install",
    target: "fastapi==0.110.0",
    agent_id: "codex-agent-11",
    verdict: "ALLOW",
    confidence: 0.99,
    rules_triggered: [],
    signals: [],
    reason: "trusted package — verified maintainer, 30M+ downloads",
    provenance:
      "fastapi 0.110.0 is a popular web framework. Verified maintainer (tiangolo), no anomalies.",
    thread_id: "thread-fastapi",
    duration_ms: 160,
    is_real_attack: false,
  },
  {
    id: "clean-uvicorn",
    timestamp: "2026-03-28T09:18:55Z",
    action_type: "package_install",
    target: "uvicorn==0.29.0",
    agent_id: "codex-agent-02",
    verdict: "ALLOW",
    confidence: 0.98,
    rules_triggered: [],
    signals: [],
    reason: "trusted package — verified maintainer, stable release history",
    provenance:
      "uvicorn 0.29.0 is a standard ASGI server. Verified maintainer (encode), consistent release cadence.",
    thread_id: "thread-uvicorn",
    duration_ms: 140,
    is_real_attack: false,
  },
  {
    id: "clean-numpy",
    timestamp: "2026-03-28T09:19:10Z",
    action_type: "package_install",
    target: "numpy==1.25.2",
    agent_id: "codex-agent-09",
    verdict: "ALLOW",
    confidence: 0.99,
    rules_triggered: [],
    signals: [],
    reason: "trusted package — NumPy core, verified maintainer, 200M+ downloads",
    provenance:
      "numpy 1.25.2 is the latest stable release of the core scientific computing library. Verified maintainer (numpy team), no anomalies.",
    thread_id: "thread-numpy-clean",
    duration_ms: 130,
    is_real_attack: false,
  },
  {
    id: "clean-anthropic",
    timestamp: "2026-03-28T09:19:25Z",
    action_type: "package_install",
    target: "anthropic==0.21.0",
    agent_id: "codex-agent-04",
    verdict: "ALLOW",
    confidence: 0.99,
    rules_triggered: [],
    signals: [],
    reason: "trusted package — verified publisher (Anthropic), signed release",
    provenance:
      "anthropic 0.21.0 is the official Anthropic Python SDK. Verified publisher, signed wheel, consistent release history.",
    thread_id: "thread-anthropic",
    duration_ms: 120,
    is_real_attack: false,
  },
  {
    id: "clean-pytest",
    timestamp: "2026-03-28T09:19:40Z",
    action_type: "package_install",
    target: "pytest==8.1.0",
    agent_id: "codex-agent-07",
    verdict: "ALLOW",
    confidence: 0.99,
    rules_triggered: [],
    signals: [],
    reason: "trusted package — pytest core, verified maintainer, 100M+ downloads",
    provenance:
      "pytest 8.1.0 is the standard Python testing framework. Verified maintainer (pytest-dev), no anomalies.",
    thread_id: "thread-pytest",
    duration_ms: 110,
    is_real_attack: false,
  },
];

export const mockDecisions: Decision[] = [
  ...mockMaliciousDecisions,
  ...mockCleanDecisions,
];

// Pinned litellm entry — always returned regardless of drip-feed position
const PINNED_LITELLM = mockMaliciousDecisions[0]; // litellm-supply-chain

// Drip-feed: module-scoped counter releases 1-2 new entries per API call.
// NOTE: Module-level mutable state works for demo/dev but is unreliable in
// serverless production where each request may cold-start a new instance.
let dripCursor = 0;

export function getDripFeedDecisions(): Decision[] {
  const pool = mockDecisions.filter((d) => d.id !== PINNED_LITELLM.id);
  const step = 1 + Math.floor(Math.random() * 2); // 1 or 2
  const end = Math.min(dripCursor + step, pool.length);
  const visible = pool.slice(0, end);
  dripCursor = end >= pool.length ? pool.length : end;

  return [PINNED_LITELLM, ...visible];
}

/** Read current drip-feed state without advancing the cursor. */
export function peekDripFeedDecisions(): Decision[] {
  const pool = mockDecisions.filter((d) => d.id !== PINNED_LITELLM.id);
  const visible = pool.slice(0, dripCursor);
  return [PINNED_LITELLM, ...visible];
}

export function resetDripFeed(): void {
  dripCursor = 0;
}
