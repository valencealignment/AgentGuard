import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { evaluateScenario } from "../../packages/policy-engine/index.js";
import { buildResearchBundle } from "../../packages/research-engine/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const scenariosPath = path.join(root, "packages", "demo-scenarios", "canonical_scenarios.json");
const securityEventsPath = path.join(root, "ops", "events", "security.jsonl");
const securityStatusPath = path.join(root, "ops", "status", "security.json");
const securityReportsDir = path.join(root, "ops", "reports", "security");
const securityBlogsDir = path.join(root, "ops", "reports", "blogs");
const securityDomainEventsPath = path.join(securityReportsDir, "domain-events.json");
const latestRunPath = path.join(securityReportsDir, "latest-run.json");
const metricsPath = path.join(securityReportsDir, "metrics.json");

function isoNow() {
  return new Date().toISOString();
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, payload) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function appendJsonl(filePath, payload) {
  ensureParent(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`, "utf8");
}

function writeText(filePath, payload) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, payload, "utf8");
}

function repoRelative(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function gitBranch() {
  try {
    return execFileSync("git", ["branch", "--show-current"], {
      cwd: root,
      encoding: "utf8"
    }).trim() || "unknown";
  } catch {
    return "unknown";
  }
}

function laneEvent({
  messageType,
  eventType,
  title,
  summary,
  severity = "info",
  status = "open",
  artifacts = [],
  extra = {}
}) {
  return {
    id: crypto.randomUUID(),
    ts: isoNow(),
    source: "security",
    message_type: messageType,
    type: eventType,
    title,
    summary,
    status,
    severity,
    artifacts,
    lane: "security",
    ...extra
  };
}

function domainEvent({
  eventType,
  subjectKind,
  subjectId,
  title,
  summary,
  severity = "info",
  decision = null,
  status = "emitted",
  artifacts = [],
  extra = {}
}) {
  return {
    id: crypto.randomUUID(),
    ts: isoNow(),
    source: "security-research",
    type: eventType,
    subject_kind: subjectKind,
    subject_id: subjectId,
    severity,
    decision,
    title,
    summary,
    status,
    artifacts,
    ...extra
  };
}

function updateStatus(branch, currentTask, percentComplete, blockers, extras = {}) {
  writeJson(securityStatusPath, {
    lane: "security",
    branch,
    current_task: currentTask,
    percent_complete: percentComplete,
    last_heartbeat: isoNow(),
    blockers,
    demo_readiness: percentComplete >= 95 ? "security-ready" : "warming-up",
    ...extras
  });
}

function runMerck(iterations) {
  const result = spawnSync("python3", ["merck_loop.py", "--iterations", String(iterations)], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status === 0) {
    return [];
  }
  const detail = (result.stderr || result.stdout || "unknown error").trim();
  return [`MERCK loop fallback triggered: ${detail}`];
}

function ensureDirectories() {
  fs.mkdirSync(securityReportsDir, { recursive: true });
  fs.mkdirSync(securityBlogsDir, { recursive: true });
}

function writeScenarioArtifacts(scenario, evaluation, bundle) {
  const baseName = scenario.id.replaceAll("/", "-");
  const researchJsonPath = path.join(securityReportsDir, `${baseName}-research.json`);
  const remediationMdPath = path.join(securityReportsDir, `${baseName}-remediation.md`);

  writeJson(researchJsonPath, {
    generated_at: isoNow(),
    scenario_id: scenario.id,
    scenario_title: scenario.title,
    evaluation,
    summary: bundle.summary,
    remediation: bundle.remediation
  });
  writeText(
    remediationMdPath,
    [
      `# ${scenario.title} remediation`,
      "",
      bundle.summary,
      "",
      "## Recommended actions",
      ...bundle.remediation.map((item) => `- ${item}`),
      ""
    ].join("\n")
  );

  const artifacts = [repoRelative(researchJsonPath), repoRelative(remediationMdPath)];
  let blogPath = null;
  let patchPath = null;

  if (scenario.id.includes("litellm")) {
    blogPath = path.join(securityBlogsDir, "litellm-advisory.md");
    writeText(blogPath, `${bundle.blogMarkdown}\n`);

    const advisoryPath = path.join(securityReportsDir, "litellm-remediation-brief.md");
    writeText(advisoryPath, `${bundle.advisoryMarkdown}\n`);
    artifacts.push(repoRelative(advisoryPath));

    if (bundle.patchProposal) {
      patchPath = path.join(securityReportsDir, "package-patch-proposal.json");
      writeJson(patchPath, {
        generated_at: isoNow(),
        scenario_id: scenario.id,
        ...bundle.patchProposal
      });
      artifacts.push(repoRelative(patchPath));
    }
    artifacts.push(repoRelative(blogPath));
  }

  if (scenario.id.includes("poor-reputation-external-agent")) {
    const noticePath = path.join(securityReportsDir, "external-agent-quarantine.md");
    writeText(noticePath, `${bundle.advisoryMarkdown}\n`);
    artifacts.push(repoRelative(noticePath));
  }

  return { artifacts, blogPath, patchPath };
}

function buildLaneOutputs(branch, blockers) {
  ensureDirectories();
  const metrics = readJson(metricsPath, {
    metrics: {
      f1_score: 0,
      false_pos_rate: 1,
      catch_rate: 0
    },
    merck_summary: "MERCK metrics unavailable."
  });
  const scenarios = readJson(scenariosPath, []);
  const domainEvents = [];
  const latestDecisions = [];
  const summary = {
    generated_at: isoNow(),
    branch,
    blockers,
    scenarios: [],
    research_artifacts: [],
    decision_counts: {
      ALLOW: 0,
      BLOCK: 0,
      ESCALATE: 0
    }
  };
  const reputationSnapshot = [];

  for (const scenario of scenarios) {
    const evaluation = evaluateScenario(scenario);
    const bundle = buildResearchBundle({ scenario, evaluation, metrics });
    const { artifacts, blogPath, patchPath } = writeScenarioArtifacts(scenario, evaluation, bundle);

    latestDecisions.push(`${scenario.id}:${evaluation.verdict}`);
    summary.decision_counts[evaluation.verdict] += 1;
    summary.scenarios.push({
      id: scenario.id,
      title: scenario.title,
      decision: evaluation.verdict,
      severity: evaluation.severity,
      risk_score: evaluation.risk_score,
      reason: evaluation.reason,
      artifacts
    });
    summary.research_artifacts.push(...artifacts);
    reputationSnapshot.push({
      generated_at: isoNow(),
      scenario_id: scenario.id,
      ...bundle.reputationSnapshot
    });

    appendJsonl(
      securityEventsPath,
      laneEvent({
        messageType: "HANDOFF",
        eventType: `decision.${evaluation.verdict.toLowerCase()}`,
        title: `${scenario.title} policy decision`,
        summary: evaluation.reason,
        severity: evaluation.severity,
        status: "completed",
        artifacts,
        extra: {
          branch,
          scenario_id: scenario.id,
          decision: evaluation.verdict
        }
      })
    );

    domainEvents.push(
      domainEvent({
        eventType: `decision.${evaluation.verdict.toLowerCase()}`,
        subjectKind: "scenario",
        subjectId: scenario.id,
        title: `${scenario.title} policy decision`,
        summary: evaluation.reason,
        severity: evaluation.severity,
        decision: evaluation.verdict,
        status: "completed",
        artifacts
      })
    );

    appendJsonl(
      securityEventsPath,
      laneEvent({
        messageType: "HANDOFF",
        eventType: "research.generated",
        title: `${scenario.title} research bundle ready`,
        summary: bundle.summary,
        severity: evaluation.severity,
        status: "completed",
        artifacts
      })
    );
    domainEvents.push(
      domainEvent({
        eventType: "research.generated",
        subjectKind: "research",
        subjectId: `${scenario.id}:research`,
        title: `${scenario.title} research bundle ready`,
        summary: bundle.summary,
        severity: evaluation.severity,
        artifacts
      })
    );

    appendJsonl(
      securityEventsPath,
      laneEvent({
        messageType: "HANDOFF",
        eventType: "reputation.updated",
        title: `${scenario.agent.name} reputation updated`,
        summary: `${bundle.reputationSnapshot.resulting_label} (${bundle.reputationSnapshot.resulting_score})`,
        severity: evaluation.severity,
        status: "completed",
        artifacts
      })
    );
    domainEvents.push(
      domainEvent({
        eventType: "reputation.updated",
        subjectKind: "agent",
        subjectId: scenario.agent.id,
        title: `${scenario.agent.name} reputation updated`,
        summary: `${bundle.reputationSnapshot.resulting_label} (${bundle.reputationSnapshot.resulting_score})`,
        severity: evaluation.severity,
        artifacts
      })
    );

    if (blogPath) {
      appendJsonl(
        securityEventsPath,
        laneEvent({
          messageType: "HANDOFF",
          eventType: "blog.generated",
          title: "LiteLLM advisory draft generated",
          summary: "Human-readable advisory draft is ready for approval and publication.",
          severity: "high",
          status: "completed",
          artifacts: [repoRelative(blogPath)]
        })
      );
      domainEvents.push(
        domainEvent({
          eventType: "blog.generated",
          subjectKind: "report",
          subjectId: "litellm-advisory",
          title: "LiteLLM advisory draft generated",
          summary: "Human-readable advisory draft is ready for approval and publication.",
          severity: "high",
          artifacts: [repoRelative(blogPath)]
        })
      );
    }

    if (patchPath) {
      appendJsonl(
        securityEventsPath,
        laneEvent({
          messageType: "HANDOFF",
          eventType: "package.patch_proposed",
          title: "LiteLLM patch proposal ready",
          summary: "Pinning guidance and cleanup steps were generated for the blocked package path.",
          severity: "high",
          status: "completed",
          artifacts: [repoRelative(patchPath)]
        })
      );
      domainEvents.push(
        domainEvent({
          eventType: "package.patch_proposed",
          subjectKind: "package",
          subjectId: "litellm",
          title: "LiteLLM patch proposal ready",
          summary: "Pinning guidance and cleanup steps were generated for the blocked package path.",
          severity: "high",
          artifacts: [repoRelative(patchPath)]
        })
      );
    }

    if (scenario.id.includes("poor-reputation-external-agent")) {
      appendJsonl(
        securityEventsPath,
        laneEvent({
          messageType: "HANDOFF",
          eventType: "external_agent.blocked",
          title: "Poor-reputation external agent blocked",
          summary: "Zero-trust policy denied the external agent before side effects executed.",
          severity: "critical",
          status: "completed",
          artifacts
        })
      );
      appendJsonl(
        securityEventsPath,
        laneEvent({
          messageType: "HANDOFF",
          eventType: "notification.sent",
          title: "Security notification sent",
          summary: "Notified both the human queue and the external agent owner to remediate trust posture.",
          severity: "critical",
          status: "completed",
          artifacts
        })
      );
      domainEvents.push(
        domainEvent({
          eventType: "external_agent.blocked",
          subjectKind: "agent",
          subjectId: scenario.agent.id,
          title: "Poor-reputation external agent blocked",
          summary: "Zero-trust policy denied the external agent before side effects executed.",
          severity: "critical",
          decision: "BLOCK",
          artifacts
        })
      );
      domainEvents.push(
        domainEvent({
          eventType: "notification.sent",
          subjectKind: "notification",
          subjectId: `${scenario.agent.id}:remediation`,
          title: "Security notification sent",
          summary: "Notified both the human queue and the external agent owner to remediate trust posture.",
          severity: "critical",
          decision: "BLOCK",
          artifacts
        })
      );
    }
  }

  const escalationArtifacts = [];
  const advisoryPath = path.join(securityBlogsDir, "litellm-advisory.md");
  if (fs.existsSync(advisoryPath)) {
    escalationArtifacts.push(repoRelative(advisoryPath));
  }
  appendJsonl(
    securityEventsPath,
    laneEvent({
      messageType: "HANDOFF",
      eventType: "decision.escalate",
      title: "Advisory publication escalated for approval",
      summary: "The advisory draft is ready, but publication requires a human approval checkpoint.",
      severity: "warning",
      status: "completed",
      artifacts: escalationArtifacts,
      extra: {
        branch,
        decision: "ESCALATE"
      }
    })
  );
  appendJsonl(
    securityEventsPath,
    laneEvent({
      messageType: "HANDOFF",
      eventType: "human.approval_requested",
      title: "Approve LiteLLM advisory publication",
      summary: "Human review is required before publishing the remediation brief to operators.",
      severity: "warning",
      status: "completed",
      artifacts: escalationArtifacts
    })
  );
  domainEvents.push(
    domainEvent({
      eventType: "decision.escalate",
      subjectKind: "approval",
      subjectId: "litellm-advisory-publication",
      title: "Advisory publication escalated for approval",
      summary: "The advisory draft is ready, but publication requires a human approval checkpoint.",
      severity: "warning",
      decision: "ESCALATE",
      artifacts: escalationArtifacts
    })
  );
  domainEvents.push(
    domainEvent({
      eventType: "human.approval_requested",
      subjectKind: "approval",
      subjectId: "litellm-advisory-publication",
      title: "Approve LiteLLM advisory publication",
      summary: "Human review is required before publishing the remediation brief to operators.",
      severity: "warning",
      decision: "ESCALATE",
      artifacts: escalationArtifacts
    })
  );

  writeJson(path.join(securityReportsDir, "reputation_snapshot.json"), {
    generated_at: isoNow(),
    agents: reputationSnapshot
  });
  writeJson(securityDomainEventsPath, domainEvents.sort((left, right) => left.ts.localeCompare(right.ts)));
  writeJson(latestRunPath, {
    ...summary,
    metrics_summary: metrics.merck_summary
  });

  return {
    metrics,
    latestDecisions,
    summary
  };
}

function runOnce({ emitClaim, finalize }) {
  const branch = gitBranch();
  const blockers = runMerck(4);

  if (emitClaim) {
    appendJsonl(
      securityEventsPath,
      laneEvent({
        messageType: "CLAIM",
        eventType: "claim.created",
        title: "Computer 2 lane claimed",
        summary: "Security research, MERCK loop, and policy outputs are initializing.",
        status: "claimed",
        artifacts: [repoRelative(securityStatusPath)],
        extra: { branch }
      })
    );
  }

  updateStatus(branch, "running MERCK loop and writing security artifacts", 35, blockers);
  appendJsonl(
    securityEventsPath,
    laneEvent({
      messageType: "STATUS",
      eventType: "heartbeat",
      title: "Security lane heartbeat",
      summary: "MERCK loop is active and security artifacts are being refreshed.",
      status: "active",
      artifacts: [repoRelative(securityStatusPath)],
      extra: { branch }
    })
  );

  const { metrics, latestDecisions, summary } = buildLaneOutputs(branch, blockers);
  updateStatus(branch, "security decisions, research, and advisories refreshed", 100, blockers, {
    latest_f1: metrics.metrics?.f1_score ?? null,
    latest_decisions: latestDecisions,
    metrics_summary: metrics.merck_summary,
    active_findings: summary.scenarios.filter((scenario) => scenario.decision !== "ALLOW").length,
    rule_status: metrics.rule_status || "self-improving"
  });

  if (finalize) {
    appendJsonl(
      securityEventsPath,
      laneEvent({
        messageType: "DONE",
        eventType: "lane.message",
        title: "Security lane ready",
        summary: "MERCK metrics, deterministic policy decisions, research artifacts, and advisory drafts are ready.",
        severity: "info",
        status: "completed",
        artifacts: [
          repoRelative(latestRunPath),
          repoRelative(metricsPath),
          repoRelative(securityDomainEventsPath)
        ],
        extra: { branch }
      })
    );
  }
}

function parseArgs(argv) {
  const args = {
    watch: false,
    emitClaim: false,
    interval: 60,
    untilEpoch: null
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--watch") args.watch = true;
    if (value === "--emit-claim") args.emitClaim = true;
    if (value === "--interval") args.interval = Number(argv[index + 1] || 60);
    if (value === "--until-epoch") args.untilEpoch = Number(argv[index + 1] || 0);
  }
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.watch) {
    runOnce({ emitClaim: args.emitClaim, finalize: true });
    return;
  }

  let first = true;
  while (true) {
    const reachedDeadline = args.untilEpoch !== null && Number.isFinite(args.untilEpoch) && Date.now() / 1000 >= args.untilEpoch;
    runOnce({ emitClaim: args.emitClaim && first, finalize: reachedDeadline });
    first = false;
    if (reachedDeadline) {
      break;
    }
    await sleep(args.interval * 1000);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
