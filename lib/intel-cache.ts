import type { PackageLookupResult } from "./types";

const CACHE: Record<string, PackageLookupResult> = {
  litellm: {
    name: "litellm",
    version: "1.56.5",
    license: "MIT",
    dep_count: 23,
    cves: [
      {
        id: "CVE-2024-47764",
        cvss: 9.1,
        epss: 0.89,
        summary: "Server-Side Request Forgery allowing access to internal services via proxy endpoint",
      },
      {
        id: "CVE-2024-48912",
        cvss: 8.4,
        epss: 0.74,
        summary: "Authentication bypass in admin API allows unauthorized model configuration changes",
      },
    ],
    risk_score: 96,
    verdict: "BLOCK",
  },

  httpx: {
    name: "httpx",
    version: "0.27.0",
    license: "BSD-3-Clause",
    dep_count: 7,
    cves: [],
    risk_score: 8,
    verdict: "ALLOW",
  },

  numpy: {
    name: "numpy",
    version: "1.24.0",
    license: "BSD-3-Clause",
    dep_count: 0,
    cves: [
      {
        id: "CVE-2023-33733",
        cvss: 7.5,
        epss: 0.72,
        summary: "Denial-of-service via crafted input to numpy.loadtxt function",
      },
    ],
    risk_score: 54,
    verdict: "ESCALATE",
  },
};

export function getCachedLookup(packageName: string): PackageLookupResult | null {
  return CACHE[packageName.toLowerCase()] ?? null;
}

export function isCached(packageName: string): boolean {
  return packageName.toLowerCase() in CACHE;
}
