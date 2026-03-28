import { describe, it, expect, beforeEach } from "vitest";

// mock-iterations uses module-level mutable state, so we need dynamic imports
// to reset between test groups. For simplicity, we test the exported functions
// knowing state accumulates within a describe block.

let mod: typeof import("../mock-iterations");

beforeEach(async () => {
  // Re-import to get fresh module state
  // vitest caches modules, so we use resetModules via vi
  const { vi } = await import("vitest");
  vi.resetModules();
  mod = await import("../mock-iterations");
});

describe("getIterations", () => {
  it("returns the 5 baseline iterations initially (including one rollback)", () => {
    const iters = mod.getIterations();
    expect(iters.length).toBe(5);
    expect(iters[0].label).toBe("baseline");
    expect(iters[0].score).toBe(62);
  });

  it("returns a copy (mutations do not affect internal state)", () => {
    const iters = mod.getIterations();
    iters.pop();
    expect(mod.getIterations().length).toBe(5);
  });

  it("includes a rolled-back iteration with kept === false", () => {
    const iters = mod.getIterations();
    const rollback = iters.find((i) => i.kept === false);
    expect(rollback).toBeDefined();
    expect(rollback!.id).toBe("iter-2b");
    expect(rollback!.delta).toBeLessThan(0);
  });

  it("all non-rollback iterations have kept === true", () => {
    const iters = mod.getIterations();
    const kept = iters.filter((i) => i.kept === true);
    expect(kept.length).toBe(4);
  });
});

describe("runNextIteration", () => {
  it("returns a new iteration with a kept field", () => {
    const iter = mod.runNextIteration();
    expect(typeof iter.kept).toBe("boolean");
  });

  it("increments the iteration count in the label", () => {
    const iter = mod.runNextIteration();
    // Starts after iter-3 (5 initial entries, iterationCount=3 at module init...
    // but now there are 5 items so iterationCount is still based on naming)
    expect(iter.label).toMatch(/^iter-\d+$/);
  });

  it("appends to the MOCK_ITERATIONS array", () => {
    mod.runNextIteration();
    const iters = mod.getIterations();
    expect(iters.length).toBe(6);
  });

  it("caps score at 99 for kept iterations", () => {
    // Run many iterations to approach cap
    let lastKept;
    for (let i = 0; i < 30; i++) {
      const iter = mod.runNextIteration();
      if (iter.kept) lastKept = iter;
    }
    expect(lastKept!.score).toBeLessThanOrEqual(99);
    expect(mod.getCurrentScore()).toBeLessThanOrEqual(99);
  });

  it("rolled-back iterations have negative delta and kept === false", () => {
    // Run enough iterations to likely hit a rollback (20% chance each)
    const rollbacks = [];
    for (let i = 0; i < 50; i++) {
      const iter = mod.runNextIteration();
      if (!iter.kept) rollbacks.push(iter);
    }
    // With 50 tries at 20% chance, extremely unlikely to get 0 rollbacks
    expect(rollbacks.length).toBeGreaterThan(0);
    for (const rb of rollbacks) {
      expect(rb.delta).toBeLessThan(0);
      expect(rb.kept).toBe(false);
    }
  });
});

describe("getCurrentScore", () => {
  it("returns 85 initially (baseline score after iter-3)", () => {
    expect(mod.getCurrentScore()).toBe(85);
  });

  it("increases after a kept iteration", () => {
    const before = mod.getCurrentScore();
    // Run until we get a kept iteration
    let iter;
    for (let i = 0; i < 20; i++) {
      iter = mod.runNextIteration();
      if (iter.kept) break;
    }
    if (iter?.kept) {
      expect(mod.getCurrentScore()).toBeGreaterThan(before);
    }
  });
});
