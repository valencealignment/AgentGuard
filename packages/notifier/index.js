export function buildNotification({
  target,
  title,
  summary,
  severity = "info",
  decision = null,
  requiresHumanApproval = false
}) {
  return {
    target,
    title,
    summary,
    severity,
    decision,
    requires_human_approval: requiresHumanApproval,
    ts: new Date().toISOString()
  };
}
