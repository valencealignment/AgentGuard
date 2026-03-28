import type { ExposedInstance, CveDetail } from "@/lib/types";
import { CveTable } from "./CveTable";
import { CrossReferenceCallout } from "./CrossReferenceCallout";

interface InstanceDetailProps {
  instance: ExposedInstance;
  cveDetails: Record<string, CveDetail>;
  aptDescriptions: Record<string, string>;
  onEnforcementRef?: (ref: string) => void;
}

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function InstanceDetail({
  instance,
  cveDetails,
  aptDescriptions,
  onEnforcementRef,
}: InstanceDetailProps) {
  const days = daysSince(instance.exposed_since);
  const riskColor =
    instance.risk_score >= 85
      ? "text-verdict-block"
      : instance.risk_score >= 60
        ? "text-verdict-escalate"
        : "text-foreground/50";

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-4">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-mono text-lg text-foreground">
              {instance.ip}
            </h2>
            <p className="text-xs text-foreground/50">{instance.hostname}</p>
          </div>
          <span className={`text-3xl font-bold ${riskColor}`}>
            {instance.risk_score}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-foreground/70">
            {instance.cloud}
          </span>
          <span className="text-foreground/50">{instance.region}</span>
          <span className="text-foreground/40">·</span>
          <span className={days > 30 ? "text-verdict-block" : "text-foreground/50"}>
            Exposed for {days} days
          </span>
          <span className="text-foreground/40">·</span>
          {/* Auth status badge */}
          <span
            className={`rounded px-1.5 py-0.5 font-semibold ${
              instance.auth_status === "AUTH_DISABLED"
                ? "bg-verdict-block/15 text-verdict-block"
                : instance.auth_status === "WEAK_AUTH"
                  ? "bg-verdict-escalate/15 text-verdict-escalate"
                  : "bg-verdict-allow/15 text-verdict-allow"
            }`}
          >
            {instance.auth_status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Credential leak callout */}
      {instance.credential_leaks && instance.credential_leaks.length > 0 && (
        <div className="rounded border border-verdict-escalate/30 bg-verdict-escalate/10 px-3 py-2">
          <p className="text-xs font-semibold text-verdict-escalate">
            Leaked Credentials Detected
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {instance.credential_leaks.map((key) => (
              <span
                key={key}
                className="rounded bg-verdict-escalate/15 px-1.5 py-0.5 font-mono text-[10px] text-verdict-escalate"
              >
                {key}
              </span>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-verdict-escalate/70">
            This instance has exposed credentials in reachable endpoints.
          </p>
        </div>
      )}

      {/* Enforcement log cross-reference */}
      {instance.enforcement_ref && onEnforcementRef && (
        <CrossReferenceCallout
          label="This instance appears in your enforcement log as a WARN event."
          targetId={instance.enforcement_ref}
          onClick={onEnforcementRef}
        />
      )}

      {/* CVE Profile */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase text-foreground/50">
          CVE Profile
        </h3>
        <CveTable cveIds={instance.cves} cveDetails={cveDetails} />
        {instance.cves.length > 0 && (
          <p className="mt-1 text-[10px] text-foreground/30">
            Source: OSV · pre-fetched
          </p>
        )}
      </div>

      {/* APT Attribution */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase text-foreground/50">
          APT Attribution
        </h3>
        {instance.apts.length === 0 ? (
          <p className="text-xs text-foreground/30">
            No known threat actor association
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {instance.apts.map((apt) => (
              <div key={apt} className="flex items-start gap-2">
                <span className="shrink-0 rounded bg-verdict-block/15 px-1.5 py-0.5 text-[10px] font-semibold text-verdict-block">
                  {apt}
                </span>
                <span className="text-[10px] text-foreground/50">
                  {aptDescriptions[apt] ?? "Threat actor group"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MCP-specific flags */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase text-foreground/50">
          MCP Flags
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <FlagBadge
            label={instance.auth_status === "AUTH_DISABLED" ? "NO AUTH" : instance.auth_status === "WEAK_AUTH" ? "WEAK JWT" : "AUTH OK"}
            severity={instance.auth_status === "AUTH_DISABLED" ? "critical" : instance.auth_status === "WEAK_AUTH" ? "warning" : "ok"}
          />
          <FlagBadge label="RATE LIMITING: NONE" severity="warning" />
          <FlagBadge label="TOOL EXPOSURE: ALL TOOLS PUBLIC" severity="critical" />
          <FlagBadge
            label={instance.version.includes("0.8") || instance.version.includes("0.9") ? "VERSION: OUTDATED" : "VERSION: CURRENT"}
            severity={instance.version.includes("0.8") || instance.version.includes("0.9") ? "warning" : "ok"}
          />
        </div>
      </div>

      {/* Notes */}
      {instance.notes && (
        <p className="text-[10px] italic text-foreground/40">
          {instance.notes}
        </p>
      )}
    </div>
  );
}

function FlagBadge({
  label,
  severity,
}: {
  label: string;
  severity: "critical" | "warning" | "ok";
}) {
  const colors = {
    critical: "bg-verdict-block/15 text-verdict-block",
    warning: "bg-verdict-escalate/15 text-verdict-escalate",
    ok: "bg-verdict-allow/15 text-verdict-allow",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colors[severity]}`}>
      {label}
    </span>
  );
}
