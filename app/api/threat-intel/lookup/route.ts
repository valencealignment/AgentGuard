import { NextRequest, NextResponse } from "next/server";
import { getCachedLookup } from "@/lib/intel-cache";
import { fetchDepsDevPackage, fetchOsvVulns } from "@/lib/api-utils";
import { computePackageRiskScore, riskScoreToVerdict } from "@/lib/risk-score";
import type { CveDetail, PackageLookupResult } from "@/lib/types";

export async function GET(request: NextRequest) {
  const packageName = request.nextUrl.searchParams.get("package");

  if (!packageName) {
    return NextResponse.json({ error: "Missing ?package= parameter" }, { status: 400 });
  }

  // Fast path: check pre-cache first
  const cached = getCachedLookup(packageName);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Live fallback: deps.dev + OSV in parallel
  const [depsData, osvData] = await Promise.all([
    fetchDepsDevPackage(packageName),
    fetchOsvVulns(packageName),
  ]);

  if (!depsData && !osvData) {
    return NextResponse.json(
      { error: "Enrichment unavailable", name: packageName },
      { status: 502 }
    );
  }

  const cves: CveDetail[] = (osvData ?? []).map((v) => {
    const severityEntry = v.severity?.find((s) => s.type === "CVSS_V3");
    // OSV returns CVSS vector strings, not numeric scores — parseFloat safely falls back to 0
    const rawCvss = severityEntry ? parseFloat(severityEntry.score) : 0;
    const cvss = Number.isNaN(rawCvss) ? 0 : rawCvss;
    return {
      id: v.id,
      cvss,
      epss: 0, // OSV doesn't provide EPSS
      summary: v.summary ?? v.details?.slice(0, 200) ?? "No description available",
    };
  });

  const depCount = depsData?.dependencyCount ?? 0;
  const license = depsData?.licenses?.[0] ?? "Unknown";
  const version = depsData?.version ?? "latest";

  const riskScore = computePackageRiskScore({
    cves,
    dep_count: depCount,
  });

  const result: PackageLookupResult = {
    name: packageName,
    version,
    license,
    dep_count: depCount,
    cves,
    risk_score: riskScore,
    verdict: riskScoreToVerdict(riskScore),
  };

  return NextResponse.json(result);
}
