import { describe, it, expect } from "vitest";
import {
  transformVerdict,
  transformLogRecords,
  transformMetrics,
  transformCheckResult,
  type GuardLogRecord,
  type GuardMetricsResponse,
  type GuardCheckResponse,
} from "../guard-transforms";

describe("transformVerdict", () => {
  it("uppercases block", () => {
    expect(transformVerdict("block")).toBe("BLOCK");
  });

  it("uppercases allow", () => {
    expect(transformVerdict("allow")).toBe("ALLOW");
  });

  it("uppercases warn", () => {
    expect(transformVerdict("warn")).toBe("WARN");
  });

  it("handles already uppercase", () => {
    expect(transformVerdict("ESCALATE")).toBe("ESCALATE");
  });

  it("defaults unknown verdict to BLOCK", () => {
    expect(transformVerdict("unknown")).toBe("BLOCK");
  });
});

describe("transformLogRecords", () => {
  const records: GuardLogRecord[] = [
    {
      timestamp: "2026-03-28T10:00:00Z",
      iteration: 0,
      accuracy: 0.6,
      f1_score: 0.62,
      catch_rate: 0.7,
      false_pos_rate: 0.1,
      mutation: "baseline",
      mutation_category: "init",
      result: "kept",
      remaining_mistakes: [],
    },
    {
      timestamp: "2026-03-28T11:00:00Z",
      iteration: 1,
      accuracy: 0.7,
      f1_score: 0.71,
      catch_rate: 0.8,
      false_pos_rate: 0.05,
      mutation: "blocklist litellm==1.82.8",
      mutation_category: "blocklist",
      result: "kept",
      remaining_mistakes: [],
    },
    {
      timestamp: "2026-03-28T12:00:00Z",
      iteration: 2,
      accuracy: 0.65,
      f1_score: 0.68,
      catch_rate: 0.75,
      false_pos_rate: 0.08,
      mutation: "aggressive namespace collision",
      mutation_category: "heuristic",
      result: "reverted",
      remaining_mistakes: ["some-package"],
    },
  ];

  it("converts log records to Iteration array", () => {
    const iters = transformLogRecords(records);
    expect(iters.length).toBe(3);
  });

  it("rounds f1_score to integer percentage for score", () => {
    const iters = transformLogRecords(records);
    expect(iters[0].score).toBe(62);
    expect(iters[1].score).toBe(71);
  });

  it("computes delta from previous iteration", () => {
    const iters = transformLogRecords(records);
    expect(iters[0].delta).toBe(0); // baseline: delta is always 0
    expect(iters[1].delta).toBe(9); // 71 - 62
    expect(iters[2].delta).toBe(-3); // 68 - 71
  });

  it("sets kept=true for kept results", () => {
    const iters = transformLogRecords(records);
    expect(iters[0].kept).toBe(true);
    expect(iters[1].kept).toBe(true);
  });

  it("sets kept=false for reverted results", () => {
    const iters = transformLogRecords(records);
    expect(iters[2].kept).toBe(false);
  });

  it("generates correct id and label", () => {
    const iters = transformLogRecords(records);
    expect(iters[0].id).toBe("iter-0");
    expect(iters[0].label).toBe("baseline");
    expect(iters[1].id).toBe("iter-1");
    expect(iters[1].label).toBe("iter-1");
  });

  it("handles empty array", () => {
    expect(transformLogRecords([])).toEqual([]);
  });
});

describe("transformMetrics", () => {
  const metrics: GuardMetricsResponse = {
    f1_score: 0.98,
    catch_rate: 0.95,
    false_pos_rate: 0.02,
    total_iterations: 54,
    best_f1: 1.0,
  };

  it("converts best_f1 to policy_score percentage", () => {
    const result = transformMetrics(metrics);
    expect(result.policy_score).toBe(100);
  });

  it("passes through catch_rate and fp_rate", () => {
    const result = transformMetrics(metrics);
    expect(result.catch_rate).toBe(0.95);
    expect(result.fp_rate).toBe(0.02);
  });

  it("uses total_iterations for total_evaluated", () => {
    const result = transformMetrics(metrics);
    expect(result.total_evaluated).toBe(54);
  });
});

describe("transformCheckResult", () => {
  const checkResponse: GuardCheckResponse = {
    ok: true,
    timestamp: "2026-03-28T14:00:00Z",
    verdict: "block",
    reason: "package_blocklist:litellm",
    risk_score: 95,
    action: {
      id: "live-check",
      action_type: "package_install",
      target: "litellm==1.82.8",
      signals: ["reads_ssh_keys", "reads_env_vars"],
    },
  };

  it("uppercases the verdict", () => {
    const result = transformCheckResult(checkResponse);
    expect(result.verdict).toBe("BLOCK");
  });

  it("maps risk_score to confidence", () => {
    const result = transformCheckResult(checkResponse);
    expect(result.confidence).toBe(0.95);
  });

  it("preserves signals from action", () => {
    const result = transformCheckResult(checkResponse);
    expect(result.signals).toEqual(["reads_ssh_keys", "reads_env_vars"]);
  });

  it("sets rules_triggered from reason", () => {
    const result = transformCheckResult(checkResponse);
    expect(result.rules_triggered).toEqual(["package_blocklist:litellm"]);
  });

  it("sets provenance to live-guard", () => {
    const result = transformCheckResult(checkResponse);
    expect(result.provenance).toBe("live-guard");
  });

  it("generates an id starting with live-", () => {
    const result = transformCheckResult(checkResponse);
    expect(result.id).toMatch(/^live-/);
  });
});
