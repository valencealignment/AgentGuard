import { describe, it, expect } from "vitest";
import { computePackageRiskScore, riskScoreToVerdict } from "../risk-score";
import type { CveDetail } from "../types";

describe("computePackageRiskScore", () => {
  it("returns 0 for a safe, well-established package", () => {
    const score = computePackageRiskScore({
      cves: [],
      dep_count: 5,
      download_count: 1_000_000,
      age_days: 365,
      maintainer_count: 5,
      has_source_repo: true,
    });
    expect(score).toBe(0);
  });

  it("scores CVEs by max CVSS (up to 30 pts)", () => {
    const cves: CveDetail[] = [
      { id: "CVE-2024-001", cvss: 9.8, epss: 0, summary: "critical" },
    ];
    const score = computePackageRiskScore({ cves, dep_count: 0 });
    // maxCvss * 3 = 29.4, capped at 30 → 29 (rounded from 29.4)
    // + cve count: min(5, 1*2) = 2
    // epss: 0
    expect(score).toBeGreaterThanOrEqual(29);
  });

  it("scores CVEs by max EPSS (up to 15 pts)", () => {
    const cves: CveDetail[] = [
      { id: "CVE-2024-002", cvss: 0, epss: 0.95, summary: "exploited" },
    ];
    const score = computePackageRiskScore({ cves, dep_count: 0 });
    // epss * 15 = 14.25, capped at 15 → 14
    // + cve count: 2
    expect(score).toBeGreaterThanOrEqual(14);
  });

  it("adds points for multiple CVEs (up to 5 pts)", () => {
    const cves: CveDetail[] = Array.from({ length: 5 }, (_, i) => ({
      id: `CVE-2024-00${i}`,
      cvss: 1,
      epss: 0,
      summary: "minor",
    }));
    const score = computePackageRiskScore({ cves, dep_count: 0 });
    // cvss: min(30, 1*3) = 3
    // epss: 0
    // count: min(5, 5*2) = 5
    expect(score).toBe(8);
  });

  it("adds dependency count risk for >20 deps", () => {
    const score = computePackageRiskScore({ cves: [], dep_count: 40 });
    // (40 - 20) * 0.5 = 10, capped at 10
    expect(score).toBe(10);
  });

  it("does not add dependency risk for <=20 deps", () => {
    const score = computePackageRiskScore({ cves: [], dep_count: 20 });
    expect(score).toBe(0);
  });

  it("adds download risk for low-download packages", () => {
    expect(
      computePackageRiskScore({ cves: [], dep_count: 0, download_count: 50 }),
    ).toBe(15);
    expect(
      computePackageRiskScore({ cves: [], dep_count: 0, download_count: 500 }),
    ).toBe(10);
    expect(
      computePackageRiskScore({ cves: [], dep_count: 0, download_count: 5000 }),
    ).toBe(5);
    expect(
      computePackageRiskScore({
        cves: [],
        dep_count: 0,
        download_count: 50_000,
      }),
    ).toBe(0);
  });

  it("adds age risk for new packages", () => {
    expect(
      computePackageRiskScore({ cves: [], dep_count: 0, age_days: 3 }),
    ).toBe(10);
    expect(
      computePackageRiskScore({ cves: [], dep_count: 0, age_days: 15 }),
    ).toBe(7);
    expect(
      computePackageRiskScore({ cves: [], dep_count: 0, age_days: 60 }),
    ).toBe(3);
    expect(
      computePackageRiskScore({ cves: [], dep_count: 0, age_days: 120 }),
    ).toBe(0);
  });

  it("adds maintainer risk for single maintainer", () => {
    expect(
      computePackageRiskScore({
        cves: [],
        dep_count: 0,
        maintainer_count: 1,
      }),
    ).toBe(10);
    expect(
      computePackageRiskScore({
        cves: [],
        dep_count: 0,
        maintainer_count: 0,
      }),
    ).toBe(10);
  });

  it("does not add maintainer risk for >1 maintainers", () => {
    expect(
      computePackageRiskScore({
        cves: [],
        dep_count: 0,
        maintainer_count: 2,
      }),
    ).toBe(0);
  });

  it("adds 5 pts for no source repo", () => {
    expect(
      computePackageRiskScore({
        cves: [],
        dep_count: 0,
        has_source_repo: false,
      }),
    ).toBe(5);
  });

  it("caps total score at 100", () => {
    const cves: CveDetail[] = [
      { id: "CVE-MAX", cvss: 10, epss: 1.0, summary: "max" },
      { id: "CVE-MAX2", cvss: 10, epss: 1.0, summary: "max2" },
      { id: "CVE-MAX3", cvss: 10, epss: 1.0, summary: "max3" },
    ];
    const score = computePackageRiskScore({
      cves,
      dep_count: 100,
      download_count: 0,
      age_days: 1,
      maintainer_count: 0,
      has_source_repo: false,
    });
    expect(score).toBe(100);
  });
});

describe("riskScoreToVerdict", () => {
  it("returns BLOCK for score >= 70", () => {
    expect(riskScoreToVerdict(70)).toBe("BLOCK");
    expect(riskScoreToVerdict(100)).toBe("BLOCK");
  });

  it("returns ESCALATE for score >= 50 and < 70", () => {
    expect(riskScoreToVerdict(50)).toBe("ESCALATE");
    expect(riskScoreToVerdict(69)).toBe("ESCALATE");
  });

  it("returns ALLOW for score < 50", () => {
    expect(riskScoreToVerdict(0)).toBe("ALLOW");
    expect(riskScoreToVerdict(49)).toBe("ALLOW");
  });
});
