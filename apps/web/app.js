const REFRESH_MS = 15000;

const fallback = {
  watchboard: {
    lane_cards: [],
    notifications: [],
    decisions: [],
    research: [],
    generated_at: null
  },
  aggregate: {
    recent_events: [],
    reports: { integration: [], demo: [], security: [], blogs: [] }
  },
  status: {},
  demo: {
    scenarios: [],
    blockers: [],
    decision_counts: { ALLOW: 0, BLOCK: 0, ESCALATE: 0 },
    demo_ready: false
  },
  domainEvents: []
};

const scoreboardEl = document.querySelector("#scoreboard");
const laneGridEl = document.querySelector("#lane-grid");
const decisionStreamEl = document.querySelector("#decision-stream");
const approvalListEl = document.querySelector("#approval-list");
const scenarioGridEl = document.querySelector("#scenario-grid");
const timelineEl = document.querySelector("#timeline");
const artifactListEl = document.querySelector("#artifact-list");
const generatedAtEl = document.querySelector("#generated-at");
const liveBadgeEl = document.querySelector("#live-badge");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(value) {
  if (!value) return "Waiting for data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function toneForDecision(decision) {
  if (decision === "BLOCK") return "BLOCK";
  if (decision === "ESCALATE") return "ESCALATE";
  return "ALLOW";
}

function toneForLane(card) {
  if (!card) return "warn";
  if (card.blockers?.length) return "alert";
  if (card.stale) return "warn";
  if (card.demo_readiness?.includes("ready")) return "ok";
  return "warn";
}

function renderEmpty(target, message) {
  target.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderLaneHighlights(card) {
  const chips = [];
  if (typeof card.latest_f1 === "number") {
    chips.push(`MERCK F1 ${card.latest_f1.toFixed(3)}`);
  }
  if (card.metrics_summary) {
    chips.push(card.metrics_summary);
  }
  if (card.active_findings) {
    chips.push(`${card.active_findings} active findings`);
  }
  if (Array.isArray(card.latest_decisions) && card.latest_decisions.length) {
    chips.push(card.latest_decisions.slice(0, 2).join(" • "));
  }
  if (card.rule_status) {
    chips.push(card.rule_status);
  }
  return chips
    .map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`)
    .join("");
}

function renderScoreboard(state) {
  const laneCards = state.watchboard.lane_cards || [];
  const decisions = state.domainEvents.filter((event) => event.type.startsWith("decision."));
  const blocks = decisions.filter((event) => event.decision === "BLOCK").length;
  const approvals = state.domainEvents.filter((event) => event.type === "human.approval_requested").length;
  const stale = laneCards.filter((lane) => lane.stale).length;
  const metrics = [
    { label: "Active lanes", value: laneCards.filter((lane) => lane.percent_complete > 0 || lane.branch).length, note: "How many lanes are visibly moving" },
    { label: "Block decisions", value: blocks, note: "Judge-facing risk stops in the current demo set" },
    { label: "Approval asks", value: approvals, note: "Human review moments waiting in the flow" },
    { label: "Stale lanes", value: stale, note: "Coordination gaps that need attention fast" }
  ];
  scoreboardEl.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric-card">
          <div class="metric-card__label">${escapeHtml(metric.label)}</div>
          <div class="metric-card__value">${escapeHtml(metric.value)}</div>
          <div class="metric-card__note">${escapeHtml(metric.note)}</div>
        </article>
      `
    )
    .join("");
}

function renderLaneGrid(state) {
  const laneCards = state.watchboard.lane_cards || [];
  if (!laneCards.length) {
    renderEmpty(laneGridEl, "Lane status will appear here once repo heartbeats start flowing.");
    return;
  }
  laneGridEl.innerHTML = laneCards
    .map((card) => {
      const tone = toneForLane(card);
      const blockers = (card.blockers || []).length ? card.blockers : ["No active blockers"];
      return `
        <article class="lane-card">
          <div class="lane-card__top">
            <div>
              <div class="lane-card__title">${escapeHtml(card.lane)}</div>
              <div class="lane-card__meta">${escapeHtml(card.branch || "branch pending")}</div>
            </div>
            <span class="chip" data-tone="${tone}">${escapeHtml(card.demo_readiness || "unknown")}</span>
          </div>
          <div class="meta-line">${escapeHtml(card.current_task || "No current task yet.")}</div>
          <div class="progress" style="--progress:${Math.min(card.percent_complete || 0, 100)}%">
            <span></span>
          </div>
          <div class="chip-row">
            <span class="chip">${escapeHtml(`${card.percent_complete || 0}% complete`)}</span>
            <span class="chip">${escapeHtml(card.stale ? "stale feed" : `heartbeat ${formatTime(card.last_heartbeat)}`)}</span>
            ${renderLaneHighlights(card)}
          </div>
          <div class="meta-line">${escapeHtml(blockers[0])}</div>
        </article>
      `;
    })
    .join("");
}

function renderDecisionStream(state) {
  const decisions = state.domainEvents
    .filter((event) => event.type.startsWith("decision."))
    .slice(-6)
    .reverse();
  if (!decisions.length) {
    renderEmpty(decisionStreamEl, "Decision events will appear here when the demo lane emits allow, block, or escalate artifacts.");
    return;
  }
  decisionStreamEl.innerHTML = decisions
    .map(
      (event) => `
        <article class="scenario-card">
          <div class="scenario-card__top">
            <div>
              <div class="scenario-card__title">${escapeHtml(event.title)}</div>
              <div class="card__subtext">${escapeHtml(event.summary)}</div>
            </div>
            <span class="artifact-pill" data-tone="${toneForDecision(event.decision)}">${escapeHtml(event.decision || event.type)}</span>
          </div>
          <div class="chip-row">
            ${(event.artifacts || [])
              .map((artifact) => `<span class="chip">${escapeHtml(artifact)}</span>`)
              .join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function renderApprovals(state) {
  const approvals = state.domainEvents
    .filter((event) => event.type === "human.approval_requested")
    .slice()
    .reverse();
  if (!approvals.length) {
    renderEmpty(approvalListEl, "The approval queue is empty right now.");
    return;
  }
  approvalListEl.innerHTML = approvals
    .map(
      (approval) => `
        <article class="approval-card">
          <div class="approval-card__top">
            <div>
              <div class="approval-card__title">${escapeHtml(approval.title)}</div>
              <div class="card__subtext">${escapeHtml(approval.summary)}</div>
            </div>
            <span class="artifact-pill" data-tone="${toneForDecision(approval.decision)}">${escapeHtml(approval.decision || "REVIEW")}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderScenarios(state) {
  const scenarios = state.demo.scenarios || [];
  if (!scenarios.length) {
    renderEmpty(scenarioGridEl, "Scenario cards will render when the demo summary is available.");
    return;
  }
  scenarioGridEl.innerHTML = scenarios
    .map(
      (scenario) => `
        <article class="scenario-card">
          <div class="scenario-card__top">
            <div>
              <div class="scenario-card__title">${escapeHtml(scenario.title)}</div>
              <div class="card__subtext">${escapeHtml(scenario.reason)}</div>
            </div>
            <span class="artifact-pill" data-tone="${toneForDecision(scenario.decision)}">${escapeHtml(scenario.decision)}</span>
          </div>
          <div class="chip-row">
            <span class="chip">${escapeHtml(scenario.report_path)}</span>
            <span class="chip">${escapeHtml(scenario.trace_path)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderTimeline(state) {
  const events = state.aggregate.recent_events || [];
  if (!events.length) {
    renderEmpty(timelineEl, "Lane messages will appear here as branches claim, hand off, and finish work.");
    return;
  }
  timelineEl.innerHTML = events
    .slice()
    .reverse()
    .map(
      (event) => `
        <article class="timeline__item">
          <div class="timeline__row">
            <strong>${escapeHtml(event.title || event.type)}</strong>
            <span class="timeline__meta">${escapeHtml(event.message_type || "STATUS")}</span>
          </div>
          <div class="card__subtext">${escapeHtml(event.summary || "No summary")}</div>
          <div class="timeline__meta">${escapeHtml(`${event.source || "unknown"} • ${formatDateTime(event.ts)}`)}</div>
        </article>
      `
    )
    .join("");
}

function renderArtifacts(state) {
  const reports = [
    ...(state.aggregate.reports?.integration || []),
    ...(state.aggregate.reports?.demo || []),
    ...(state.aggregate.reports?.security || []),
    ...(state.aggregate.reports?.blogs || []),
    ...(state.watchboard.research || [])
  ];
  const unique = Array.from(new Map(reports.map((report) => [report.path, report])).values());
  if (!unique.length) {
    renderEmpty(artifactListEl, "Report links will populate here as lanes write outputs.");
    return;
  }
  artifactListEl.innerHTML = unique
    .slice(0, 8)
    .map(
      (artifact) => `
        <article class="artifact-card">
          <div class="artifact-card__top">
            <div>
              <div class="artifact-card__title">${escapeHtml(artifact.path.split("/").pop())}</div>
              <div class="card__subtext">${escapeHtml(artifact.path)}</div>
            </div>
            <span class="chip">${escapeHtml(formatDateTime(artifact.updated_at))}</span>
          </div>
        </article>
      `
    )
    .join("");
}

async function fetchJson(url, fallbackValue) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Bad response for ${url}`);
    return await response.json();
  } catch {
    return fallbackValue;
  }
}

async function hydrate() {
  liveBadgeEl.textContent = "Refreshing";
  const [watchboard, aggregate, status, demo, domainEvents] = await Promise.all([
    fetchJson("/watchboard-state", fallback.watchboard),
    fetchJson("/status/aggregate", fallback.aggregate),
    fetchJson("/status", fallback.status),
    fetchJson("/demo/latest-run", fallback.demo),
    fetchJson("/demo/domain-events", fallback.domainEvents)
  ]);

  const state = {
    watchboard: watchboard || fallback.watchboard,
    aggregate: aggregate || fallback.aggregate,
    status: status || fallback.status,
    demo: demo || fallback.demo,
    domainEvents: domainEvents || fallback.domainEvents
  };

  generatedAtEl.textContent = `Updated ${formatDateTime(state.demo.generated_at || state.watchboard.generated_at)}`;
  liveBadgeEl.textContent = "Live";

  renderScoreboard(state);
  renderLaneGrid(state);
  renderDecisionStream(state);
  renderApprovals(state);
  renderScenarios(state);
  renderTimeline(state);
  renderArtifacts(state);
}

hydrate();
setInterval(hydrate, REFRESH_MS);
