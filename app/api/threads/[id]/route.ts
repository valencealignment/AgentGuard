import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import type { Thread } from "@/lib/types";
import {
  transformScenarioTrace,
  type ScenarioReport,
  type ScenarioTrace,
} from "@/lib/scenario-transforms";

const REPORTS_DIR = join(process.cwd(), "ops", "reports", "demo");

const MOCK_THREADS: Record<string, Thread> = {
  "thread-litellm-001": {
    id: "thread-litellm-001",
    agent_id: "coordinator-agent",
    created_at: "2026-03-28T14:12:00Z",
    messages: [
      {
        role: "system",
        content: "Evaluating package install request: litellm==1.56.5",
        timestamp: "2026-03-28T14:12:00Z",
      },
      {
        role: "assistant",
        content: "Initiating multi-agent evaluation. Dispatching to: package-risk-agent, exposure-agent, policy-agent.",
        timestamp: "2026-03-28T14:12:01Z",
        tool_calls: [
          { name: "dispatch_evaluation", args: '{"agents":["package-risk","exposure","policy"]}' },
        ],
      },
      {
        role: "tool",
        content: "package-risk-agent: BLOCK (confidence 0.97) — Package litellm==1.56.5 matches known_malicious entry. Signals: known_malicious, typosquat_detected, supply_chain_attack.",
        timestamp: "2026-03-28T14:12:03Z",
      },
      {
        role: "tool",
        content: "exposure-agent: BLOCK (confidence 0.91) — CVE-2024-47764 (CVSS 9.1) with EPSS 0.89. Active exploitation confirmed.",
        timestamp: "2026-03-28T14:12:04Z",
      },
      {
        role: "tool",
        content: "policy-agent: BLOCK (confidence 0.95) — Violates policy rules: no-known-malicious, max-cvss-threshold (9.1 > 7.0).",
        timestamp: "2026-03-28T14:12:05Z",
      },
      {
        role: "assistant",
        content: "Consensus reached: BLOCK with confidence 0.97. All 3 sub-agents agree. This is a confirmed supply chain attack vector targeting LLM orchestration frameworks. Blocking installation.",
        timestamp: "2026-03-28T14:12:06Z",
      },
    ],
  },
  "thread-numpy-002": {
    id: "thread-numpy-002",
    agent_id: "coordinator-agent",
    created_at: "2026-03-28T14:32:00Z",
    messages: [
      {
        role: "system",
        content: "Evaluating package install request: numpy==1.24.0",
        timestamp: "2026-03-28T14:32:00Z",
      },
      {
        role: "assistant",
        content: "Initiating evaluation for numpy==1.24.0. Known package, checking version-specific risks.",
        timestamp: "2026-03-28T14:32:01Z",
      },
      {
        role: "tool",
        content: "package-risk-agent: ESCALATE (confidence 0.78) — Known CVE in this version, but package itself is legitimate. Recommend human review.",
        timestamp: "2026-03-28T14:32:03Z",
      },
      {
        role: "assistant",
        content: "Escalating to human review. Version 1.24.0 has known vulnerabilities but numpy is a trusted package. Generating escalation report.",
        timestamp: "2026-03-28T14:32:05Z",
      },
    ],
  },
  "thread-httpx-003": {
    id: "thread-httpx-003",
    agent_id: "coordinator-agent",
    created_at: "2026-03-28T14:50:00Z",
    messages: [
      {
        role: "system",
        content: "Evaluating package install request: httpx==0.27.0",
        timestamp: "2026-03-28T14:50:00Z",
      },
      {
        role: "assistant",
        content: "Evaluating httpx==0.27.0. Well-known HTTP client library.",
        timestamp: "2026-03-28T14:50:01Z",
      },
      {
        role: "tool",
        content: "package-risk-agent: ALLOW (confidence 0.99) — Established package, 45M+ downloads, active maintenance, no known CVEs in this version.",
        timestamp: "2026-03-28T14:50:02Z",
      },
      {
        role: "assistant",
        content: "All agents agree: ALLOW. httpx==0.27.0 passes all checks.",
        timestamp: "2026-03-28T14:50:03Z",
      },
    ],
  },
};

async function loadScenarioThread(scenarioId: string): Promise<Thread | null> {
  try {
    const traceRaw = await readFile(
      join(REPORTS_DIR, scenarioId, "trace.json"),
      "utf-8",
    );
    const reportRaw = await readFile(
      join(REPORTS_DIR, scenarioId, "report.json"),
      "utf-8",
    );
    const trace = JSON.parse(traceRaw) as ScenarioTrace;
    const report = JSON.parse(reportRaw) as ScenarioReport;
    return transformScenarioTrace(trace, report);
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check mock threads first
  if (MOCK_THREADS[id]) {
    return NextResponse.json(MOCK_THREADS[id]);
  }

  // Try scenario trace: thread IDs are "thread-scenario-*"
  if (id.startsWith("thread-scenario-")) {
    const scenarioId = id.replace("thread-", "");
    const thread = await loadScenarioThread(scenarioId);
    if (thread) {
      return NextResponse.json(thread);
    }
  }

  return NextResponse.json({ error: "Thread not found" }, { status: 404 });
}
