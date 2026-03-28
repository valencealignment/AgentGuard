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
  it("returns the 4 baseline iterations initially", () => {
    const iters = mod.getIterations();
    expect(iters.length).toBe(4);
    expect(iters[0].label).toBe("baseline");
    expect(iters[0].score).toBe(62);
  });

  it("returns a copy (mutations do not affect internal state)", () => {
    const iters = mod.getIterations();
    iters.pop();
    expect(mod.getIterations().length).toBe(4);
  });
});

describe("runNextIteration", () => {
  it("returns a new iteration with delta between 2 and 5", () => {
    const iter = mod.runNextIteration();
    expect(iter.delta).toBeGreaterThanOrEqual(2);
    expect(iter.delta).toBeLessThanOrEqual(5);
  });

  it("increments the iteration count in the label", () => {
    const iter = mod.runNextIteration();
    expect(iter.label).toBe("iter-4");
    const iter2 = mod.runNextIteration();
    expect(iter2.label).toBe("iter-5");
  });

  it("appends to the MOCK_ITERATIONS array", () => {
    mod.runNextIteration();
    const iters = mod.getIterations();
    expect(iters.length).toBe(5);
    expect(iters[4].label).toBe("iter-4");
  });

  it("caps score at 99", () => {
    // Run many iterations to approach cap
    let lastIter;
    for (let i = 0; i < 20; i++) {
      lastIter = mod.runNextIteration();
    }
    expect(lastIter!.score).toBeLessThanOrEqual(99);
    expect(mod.getCurrentScore()).toBeLessThanOrEqual(99);
  });

  it("cycles through NEXT_MUTATIONS", () => {
    const mutations: string[] = [];
    for (let i = 0; i < mod.NEXT_MUTATIONS.length + 1; i++) {
      mutations.push(mod.runNextIteration().mutation);
    }
    // First 6 should match NEXT_MUTATIONS in order
    for (let i = 0; i < mod.NEXT_MUTATIONS.length; i++) {
      expect(mutations[i]).toBe(mod.NEXT_MUTATIONS[i]);
    }
    // 7th should wrap to first
    expect(mutations[mod.NEXT_MUTATIONS.length]).toBe(mod.NEXT_MUTATIONS[0]);
  });
});

describe("getCurrentScore", () => {
  it("returns 85 initially (baseline score after iter-3)", () => {
    expect(mod.getCurrentScore()).toBe(85);
  });

  it("increases after runNextIteration", () => {
    const before = mod.getCurrentScore();
    mod.runNextIteration();
    expect(mod.getCurrentScore()).toBeGreaterThan(before);
  });
});
