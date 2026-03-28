"use client";

import { useState } from "react";
import type { PackageLookupResult } from "@/lib/types";
import { VerdictBadge } from "@/components/dashboard/VerdictBadge";

export function PackageLookup() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PackageLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup() {
    const pkg = query.trim().toLowerCase();
    if (!pkg) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/threat-intel/lookup?package=${encodeURIComponent(pkg)}`,
      );
      if (!res.ok) {
        setError("Package not found or enrichment service unavailable");
        setLoading(false);
        return;
      }
      setResult((await res.json()) as PackageLookupResult);
    } catch {
      setError("Enrichment service unavailable");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Search input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          placeholder="Search any npm or PyPI package..."
          className="flex-1 rounded border border-surface-2 bg-surface-1 px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-accent-blue focus:outline-none"
        />
        <button
          onClick={handleLookup}
          disabled={loading || !query.trim()}
          className="rounded bg-accent-blue/15 px-4 py-2 text-xs font-semibold text-accent-blue transition-colors hover:bg-accent-blue/25 disabled:opacity-50"
        >
          {loading ? "Looking up..." : "Look up"}
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-3">
          <div className="h-4 w-48 animate-pulse rounded bg-surface-2" />
          <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
          <div className="h-20 animate-pulse rounded bg-surface-2" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <p className="text-xs text-foreground/50">{error}</p>
      )}

      {/* Result display */}
      {result && !loading && (
        <div className="flex flex-col gap-4">
          {/* Package header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {result.name}
              </h3>
              <div className="flex gap-2 text-xs text-foreground/50">
                <span>v{result.version}</span>
                <span>·</span>
                <span>{result.license}</span>
                <span>·</span>
                <span>{result.dep_count} dependencies</span>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-2xl font-bold ${
                  result.risk_score >= 80
                    ? "text-verdict-block"
                    : result.risk_score >= 50
                      ? "text-verdict-escalate"
                      : "text-verdict-allow"
                }`}
              >
                {result.risk_score}
              </span>
              <p className="text-[10px] text-foreground/40">risk score</p>
            </div>
          </div>

          {/* CVE list */}
          {result.cves.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase text-foreground/50">
                Known Vulnerabilities
              </h4>
              <div className="flex flex-col gap-1">
                {result.cves.map((cve) => (
                  <div
                    key={cve.id}
                    className="flex items-center gap-2 rounded bg-surface-2 px-2 py-1.5 text-xs"
                  >
                    <span className="font-mono text-accent-blue">
                      {cve.id}
                    </span>
                    <span
                      className={
                        cve.cvss >= 9
                          ? "text-verdict-block"
                          : "text-verdict-escalate"
                      }
                    >
                      CVSS {cve.cvss.toFixed(1)}
                    </span>
                    <span className="text-foreground/50">{cve.summary}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verdict badge */}
          <div className="flex items-center gap-2 rounded border border-surface-2 px-3 py-2">
            <span className="text-xs text-foreground/50">
              Would AgentShield block this?
            </span>
            <VerdictBadge verdict={result.verdict} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="flex flex-col items-center gap-2 py-8 text-foreground/30">
          <p className="text-sm">Search for any package to see its risk profile</p>
          <p className="text-xs">
            Try: <button className="text-accent-blue hover:underline" onClick={() => { setQuery("litellm"); }}>litellm</button>
            {" · "}
            <button className="text-accent-blue hover:underline" onClick={() => { setQuery("httpx"); }}>httpx</button>
            {" · "}
            <button className="text-accent-blue hover:underline" onClick={() => { setQuery("numpy"); }}>numpy</button>
          </p>
        </div>
      )}
    </div>
  );
}
