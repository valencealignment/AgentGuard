import { describe, it, expect, beforeEach } from "vitest";
import {
  getDripFeedDecisions,
  peekDripFeedDecisions,
  resetDripFeed,
  mockDecisions,
  mockMaliciousDecisions,
} from "../mock-data";

const PINNED_ID = "litellm-supply-chain";

beforeEach(() => {
  resetDripFeed();
});

describe("getDripFeedDecisions", () => {
  it("always includes pinned litellm entry as first element", () => {
    const decisions = getDripFeedDecisions();
    expect(decisions[0].id).toBe(PINNED_ID);
  });

  it("returns 1-2 new entries per call (plus pinned)", () => {
    const first = getDripFeedDecisions();
    // pinned + 1 or 2 pool entries
    expect(first.length).toBeGreaterThanOrEqual(2);
    expect(first.length).toBeLessThanOrEqual(3);
  });

  it("advances the cursor — subsequent calls return more entries", () => {
    const first = getDripFeedDecisions();
    const second = getDripFeedDecisions();
    expect(second.length).toBeGreaterThanOrEqual(first.length);
  });

  it("eventually returns all decisions", () => {
    const pool = mockDecisions.filter((d) => d.id !== PINNED_ID);
    // Call enough times to exhaust the pool
    let decisions: ReturnType<typeof getDripFeedDecisions> = [];
    for (let i = 0; i < pool.length; i++) {
      decisions = getDripFeedDecisions();
    }
    // Should have pinned + all pool entries
    expect(decisions.length).toBe(pool.length + 1);
  });

  it("does not duplicate the pinned entry in the pool", () => {
    // Exhaust drip feed
    const pool = mockDecisions.filter((d) => d.id !== PINNED_ID);
    let decisions: ReturnType<typeof getDripFeedDecisions> = [];
    for (let i = 0; i < pool.length; i++) {
      decisions = getDripFeedDecisions();
    }
    const pinnedCount = decisions.filter((d) => d.id === PINNED_ID).length;
    expect(pinnedCount).toBe(1);
  });
});

describe("peekDripFeedDecisions", () => {
  it("does not advance the cursor", () => {
    getDripFeedDecisions(); // advance once
    const peek1 = peekDripFeedDecisions();
    const peek2 = peekDripFeedDecisions();
    expect(peek1.length).toBe(peek2.length);
    expect(peek1.map((d) => d.id)).toEqual(peek2.map((d) => d.id));
  });

  it("returns only pinned entry at cursor=0", () => {
    const decisions = peekDripFeedDecisions();
    expect(decisions.length).toBe(1);
    expect(decisions[0].id).toBe(PINNED_ID);
  });

  it("reflects state after getDripFeedDecisions advances", () => {
    getDripFeedDecisions(); // advance
    const peeked = peekDripFeedDecisions();
    // Should have pinned + whatever the drip released
    expect(peeked.length).toBeGreaterThanOrEqual(2);
  });
});

describe("resetDripFeed", () => {
  it("resets cursor so peek returns only pinned entry", () => {
    getDripFeedDecisions();
    getDripFeedDecisions();
    resetDripFeed();
    const decisions = peekDripFeedDecisions();
    expect(decisions.length).toBe(1);
    expect(decisions[0].id).toBe(PINNED_ID);
  });
});

describe("mockDecisions dataset", () => {
  it("contains both malicious and clean decisions", () => {
    const maliciousIds = new Set(mockMaliciousDecisions.map((d) => d.id));
    const hasClean = mockDecisions.some((d) => !maliciousIds.has(d.id));
    expect(hasClean).toBe(true);
  });

  it("has unique IDs", () => {
    const ids = mockDecisions.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has valid timestamps (parseable as dates)", () => {
    for (const d of mockDecisions) {
      const parsed = new Date(d.timestamp);
      expect(parsed.getTime()).not.toBeNaN();
    }
  });
});
