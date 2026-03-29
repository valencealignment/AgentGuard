import type { PackageLookupResult } from "./types";

const CACHE: Record<string, PackageLookupResult> = {
  // ── Centerpiece attack ──────────────────────────────────────────
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

  // ── Safe baselines ──────────────────────────────────────────────
  httpx: {
    name: "httpx",
    version: "0.27.0",
    license: "BSD-3-Clause",
    dep_count: 7,
    cves: [],
    risk_score: 8,
    verdict: "ALLOW",
  },

  requests: {
    name: "requests",
    version: "2.31.0",
    license: "Apache-2.0",
    dep_count: 5,
    cves: [],
    risk_score: 5,
    verdict: "ALLOW",
  },

  flask: {
    name: "flask",
    version: "3.0.3",
    license: "BSD-3-Clause",
    dep_count: 6,
    cves: [],
    risk_score: 12,
    verdict: "ALLOW",
  },

  openai: {
    name: "openai",
    version: "1.52.0",
    license: "Apache-2.0",
    dep_count: 11,
    cves: [],
    risk_score: 10,
    verdict: "ALLOW",
  },

  anthropic: {
    name: "anthropic",
    version: "0.39.0",
    license: "MIT",
    dep_count: 8,
    cves: [],
    risk_score: 6,
    verdict: "ALLOW",
  },

  // ── Edge case (ESCALATE) ────────────────────────────────────────
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

  // ── Typosquats ──────────────────────────────────────────────────
  reqeusts: {
    name: "reqeusts",
    version: "1.0.0",
    license: "Unknown",
    dep_count: 0,
    cves: [],
    risk_score: 92,
    verdict: "BLOCK",
  },

  numppy: {
    name: "numppy",
    version: "0.1.0",
    license: "Unknown",
    dep_count: 0,
    cves: [],
    risk_score: 88,
    verdict: "BLOCK",
  },

  // ── Real malware from adversarial corpus ────────────────────────
  aiocpa: {
    name: "aiocpa",
    version: "0.1.13",
    license: "MIT",
    dep_count: 3,
    cves: [
      {
        id: "MAL-2024-aiocpa",
        cvss: 9.8,
        epss: 0.95,
        summary: "Sleeper payload activates after install, exfiltrates crypto wallet keys",
      },
    ],
    risk_score: 95,
    verdict: "BLOCK",
  },

  "jwt-secure-validator": {
    name: "jwt-secure-validator",
    version: "0.1.0",
    license: "Unknown",
    dep_count: 1,
    cves: [
      {
        id: "MAL-2024-jwt-sv",
        cvss: 9.1,
        epss: 0.91,
        summary: "Malicious JWT validator exfiltrates tokens to attacker-controlled endpoint",
      },
    ],
    risk_score: 90,
    verdict: "BLOCK",
  },

  "requests-async": {
    name: "requests-async",
    version: "0.1.0",
    license: "Unknown",
    dep_count: 2,
    cves: [
      {
        id: "MAL-2024-req-async",
        cvss: 8.7,
        epss: 0.82,
        summary: "Combosquatting package mimics requests library, injects backdoor on import",
      },
    ],
    risk_score: 85,
    verdict: "BLOCK",
  },
};

export function getCachedLookup(packageName: string): PackageLookupResult | null {
  return CACHE[packageName.toLowerCase()] ?? null;
}

export function isCached(packageName: string): boolean {
  return packageName.toLowerCase() in CACHE;
}
