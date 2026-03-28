import type { CveDetail, Verdict } from "./types";

interface RiskInput {
  cves: CveDetail[];
  dep_count: number;
  download_count?: number;
  age_days?: number;
  maintainer_count?: number;
  has_source_repo?: boolean;
}

export function computePackageRiskScore(input: RiskInput): number {
  let score = 0;

  // CVE severity (up to 50 points)
  if (input.cves.length > 0) {
    const maxCvss = Math.max(...input.cves.map((c) => c.cvss));
    const maxEpss = Math.max(...input.cves.map((c) => c.epss));
    score += Math.min(30, maxCvss * 3);
    score += Math.min(15, maxEpss * 15);
    score += Math.min(5, input.cves.length * 2);
  }

  // Dependency count risk (up to 10 points)
  if (input.dep_count > 20) {
    score += Math.min(10, (input.dep_count - 20) * 0.5);
  }

  // Download count risk — low downloads = suspicious (up to 15 points)
  if (input.download_count !== undefined) {
    if (input.download_count < 100) score += 15;
    else if (input.download_count < 1000) score += 10;
    else if (input.download_count < 10000) score += 5;
  }

  // Age risk — new packages are riskier (up to 10 points)
  if (input.age_days !== undefined) {
    if (input.age_days < 7) score += 10;
    else if (input.age_days < 30) score += 7;
    else if (input.age_days < 90) score += 3;
  }

  // Maintainer count (up to 10 points)
  if (input.maintainer_count !== undefined && input.maintainer_count <= 1) {
    score += 10;
  }

  // No source repo (5 points)
  if (input.has_source_repo === false) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
}

export function riskScoreToVerdict(score: number): Verdict {
  if (score >= 70) return "BLOCK";
  if (score >= 50) return "ESCALATE";
  return "ALLOW";
}
