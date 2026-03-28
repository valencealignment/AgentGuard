import crypto from "node:crypto";

export function makeEvent({
  source,
  type,
  title,
  summary,
  status = "open",
  severity = "info",
  decision = null,
  artifacts = []
}) {
  return {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    source,
    type,
    title,
    summary,
    status,
    severity,
    decision,
    artifacts
  };
}

export function baseLaneStatus({
  lane,
  branch,
  currentTask = "bootstrapping",
  percentComplete = 0,
  blockers = [],
  demoReadiness = "bootstrapping"
}) {
  return {
    lane,
    branch,
    current_task: currentTask,
    percent_complete: percentComplete,
    blockers,
    demo_readiness: demoReadiness,
    last_heartbeat: new Date().toISOString()
  };
}
