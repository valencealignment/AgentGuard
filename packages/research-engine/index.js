function bulletList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function litellmRemediation() {
  return [
    "Pin LiteLLM to `<=1.82.6` until the flagged installer path is cleared.",
    "Delete suspicious `.pth` startup hooks from the environment before rebuilding it.",
    "Rotate any credentials exposed during the attempted install path.",
    "Rebuild the virtual environment from a known-good lockfile and re-run receipt validation."
  ];
}

function externalAgentRemediation() {
  return [
    "Keep the external agent blocked until provenance is signed and reviewable.",
    "Require a reputation reset after evidence of patching or key rotation is supplied.",
    "Deliver a direct notification to the remote agent owner with the exact failing signals."
  ];
}

function genericRemediation() {
  return [
    "Hold the action behind approval until the evidence trail is reviewed.",
    "Prefer a safe pinned dependency or read-only fallback while the risky path is investigated."
  ];
}

export function buildResearchBundle({ scenario, evaluation, metrics = {} }) {
  const isLiteLLM =
    evaluation.package?.name === "litellm" || scenario.id.includes("litellm");
  const isExternalAgent =
    scenario.id.includes("poor-reputation-external-agent") ||
    evaluation.evidence.includes("poor_reputation");
  const remediation = isLiteLLM
    ? litellmRemediation()
    : isExternalAgent
      ? externalAgentRemediation()
      : genericRemediation();

  const advisoryTitle = isLiteLLM
    ? "LiteLLM supply-chain advisory"
    : isExternalAgent
      ? "External agent trust quarantine notice"
      : `${scenario.title} research summary`;

  const summary = `${evaluation.reason} Evidence: ${evaluation.evidence.join(", ") || "none recorded"}.`;
  const blogMarkdown = [
    `# ${advisoryTitle}`,
    "",
    "## What happened",
    summary,
    "",
    "## Why WAAL reacted",
    evaluation.explanation || evaluation.reason,
    "",
    "## Recommended remediation",
    bulletList(remediation),
    "",
    "## Current MERCK posture",
    `- Latest F1: ${metrics.metrics?.f1_score ?? "unknown"}`,
    `- False-positive rate: ${metrics.metrics?.false_pos_rate ?? "unknown"}`,
    ""
  ].join("\n");

  const advisoryMarkdown = isLiteLLM
    ? [
        "# LiteLLM remediation brief",
        "",
        "## Affected versions",
        "- `1.82.7`",
        "- `1.82.8`",
        "",
        "## Cleanup steps",
        bulletList(remediation),
        "",
        "## Human approval",
        "- Review the advisory before publication.",
        "- Confirm downstream environments pin a safe version.",
        ""
      ].join("\n")
    : [
        `# ${advisoryTitle}`,
        "",
        summary,
        "",
        "## Remediation",
        bulletList(remediation),
        ""
      ].join("\n");

  const patchProposal = isLiteLLM
    ? {
        title: "Pin LiteLLM to the last known-safe release",
        target_file: "requirements.txt",
        replacement: "litellm<=1.82.6",
        rationale: "Blocks the flagged installer path while preserving service compatibility.",
        steps: remediation
      }
    : null;

  return {
    advisoryTitle,
    summary,
    remediation,
    advisoryMarkdown,
    blogMarkdown,
    patchProposal,
    reputationSnapshot: {
      subject_id: scenario.agent.id,
      subject_name: scenario.agent.name,
      origin: scenario.agent.origin,
      resulting_score: evaluation.verdict === "ALLOW" ? 82 : evaluation.verdict === "ESCALATE" ? 48 : 18,
      resulting_label: evaluation.verdict === "ALLOW" ? "trusted" : evaluation.verdict === "ESCALATE" ? "watch" : "blocked"
    }
  };
}
