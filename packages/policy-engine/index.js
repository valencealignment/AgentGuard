const FLAGGED_PACKAGE_VERSIONS = new Map([
  ["litellm", new Set(["1.82.7", "1.82.8"])]
]);

const TYPO_SQUATS = new Set([
  "reqeusts",
  "numppy",
  "pandsa",
  "llm-utils",
  "ai-helper-toolkit"
]);

const SIGNAL_WEIGHTS = {
  reads_env_vars: 18,
  reads_ssh_keys: 22,
  opens_network_socket_during_install: 24,
  writes_pth_file: 32,
  unsigned_provenance: 28,
  outbound_webhook: 14,
  send_notification: 10,
  install_dependency: 16,
  no_tls: 22,
  network_required: 8
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function parsePackageTarget(target = "") {
  const [name = "", version = ""] = String(target).split("==");
  return {
    name: name.trim(),
    version: version.trim()
  };
}

export function normalizeSignals(context = {}) {
  const signals = new Set();
  for (const signal of context.signals || []) {
    signals.add(signal);
  }
  for (const sideEffect of context.requested_side_effects || []) {
    signals.add(sideEffect);
  }
  if (context.provenance === "unsigned") {
    signals.add("unsigned_provenance");
  }
  if (context.network_required) {
    signals.add("network_required");
  }
  if (context.tls === "absent") {
    signals.add("no_tls");
  }
  return [...signals];
}

function confidenceFor(score, verdict) {
  if (verdict === "BLOCK") {
    return clamp(0.78 + score / 200, 0.8, 0.99);
  }
  if (verdict === "ESCALATE") {
    return clamp(0.62 + score / 250, 0.65, 0.9);
  }
  return clamp(0.74 + (30 - score) / 100, 0.72, 0.97);
}

function verdictFromScore(score) {
  if (score >= 70) return "BLOCK";
  if (score >= 40) return "ESCALATE";
  return "ALLOW";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function evaluateAction({ action_type, target, source_agent = {}, context = {} }) {
  const parsedTarget = parsePackageTarget(target);
  const signals = normalizeSignals(context);
  const evidence = [];
  const reasons = [];
  let score = 0;

  if (parsedTarget.name && TYPO_SQUATS.has(parsedTarget.name)) {
    score += 92;
    reasons.push(`${parsedTarget.name} matches a blocked typosquat or slopsquat name.`);
    evidence.push("typosquat_package_name");
  }

  if (
    parsedTarget.name &&
    FLAGGED_PACKAGE_VERSIONS.get(parsedTarget.name)?.has(parsedTarget.version)
  ) {
    score += 96;
    reasons.push(`${parsedTarget.name} ${parsedTarget.version} is on the blocked package-version list.`);
    evidence.push("flagged_dependency_version");
  }

  if (source_agent.origin === "external" && source_agent.reputation === "poor") {
    score += 86;
    reasons.push("External agent reputation is below the trust threshold.");
    evidence.push("poor_reputation");
  }

  if (context.provenance === "unsigned") {
    score += 26;
    reasons.push("Unsigned provenance removes zero-trust guarantees.");
    evidence.push("unsigned_provenance");
  }

  for (const signal of signals) {
    if (SIGNAL_WEIGHTS[signal]) {
      score += SIGNAL_WEIGHTS[signal];
      evidence.push(signal);
    }
  }

  if (action_type === "report_generation" && context.depends_on) {
    score = Math.min(score, 12);
    reasons.length = 0;
    reasons.push("Read-only remediation reporting is safe to continue.");
    evidence.push("derived_from_block_event");
  }

  if (
    context.workspace_only &&
    !context.network_required &&
    !context.package_install &&
    source_agent.reputation !== "poor"
  ) {
    score = Math.min(score, 8);
    reasons.length = 0;
    reasons.push("Trusted read-only workspace action stays inside the approved boundary.");
    evidence.push("workspace_scoped_target");
  }

  let verdict = verdictFromScore(score);
  if (source_agent.origin === "external" && source_agent.reputation === "poor") {
    verdict = "BLOCK";
  }
  if (
    parsedTarget.name === "litellm" &&
    FLAGGED_PACKAGE_VERSIONS.get("litellm")?.has(parsedTarget.version)
  ) {
    verdict = "BLOCK";
  }

  if (
    verdict === "ALLOW" &&
    context.network_required &&
    source_agent.reputation === "unknown" &&
    action_type !== "report_generation"
  ) {
    verdict = "ESCALATE";
    reasons.push("Unknown agent requested network reach outside the workspace.");
    evidence.push("unknown_agent_network_request");
    score = Math.max(score, 46);
  }

  const riskScore = clamp(score, 0, 100);
  const reason =
    reasons[0] ||
    (verdict === "ALLOW"
      ? "No blocking policy signals were detected."
      : "The action crossed the zero-trust review threshold.");

  return {
    verdict,
    reason,
    risk_score: riskScore,
    confidence: Number(confidenceFor(riskScore, verdict).toFixed(2)),
    explanation: unique(reasons).join(" "),
    evidence: unique(evidence),
    signals,
    package: parsedTarget,
    reputation_delta: verdict === "ALLOW" ? 4 : verdict === "ESCALATE" ? -6 : -18
  };
}

export function evaluateScenario(scenario) {
  const evaluation = evaluateAction({
    action_type: scenario.action.type,
    target: scenario.action.target,
    source_agent: scenario.agent,
    context: scenario.action.context || {}
  });

  return {
    scenario_id: scenario.id,
    title: scenario.title,
    severity: scenario.severity,
    summary: scenario.summary,
    ...evaluation
  };
}

export function listPolicySignals() {
  return {
    blocked_versions: [...FLAGGED_PACKAGE_VERSIONS.entries()].map(([name, versions]) => ({
      name,
      versions: [...versions]
    })),
    typosquats: [...TYPO_SQUATS],
    weighted_signals: SIGNAL_WEIGHTS
  };
}
