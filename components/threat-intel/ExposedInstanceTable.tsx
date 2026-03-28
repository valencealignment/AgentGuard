import type { ExposedInstance } from "@/lib/types";

interface ExposedInstanceTableProps {
  instances: ExposedInstance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ExposedInstanceTable({
  instances,
  selectedId,
  onSelect,
}: ExposedInstanceTableProps) {
  const sorted = [...instances].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="flex flex-col overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-surface-2 text-left text-foreground/50">
            <th className="px-3 py-2 font-medium">INSTANCE</th>
            <th className="px-3 py-2 font-medium">CLOUD</th>
            <th className="px-3 py-2 font-medium">LOCATION</th>
            <th className="px-3 py-2 font-medium">CVEs</th>
            <th className="px-3 py-2 font-medium">APT</th>
            <th className="px-3 py-2 font-medium">STATUS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-2">
          {sorted.map((inst) => {
            const isSelected = inst.id === selectedId;
            const riskColor =
              inst.risk_score >= 85
                ? "border-verdict-block"
                : inst.risk_score >= 60
                  ? "border-verdict-escalate"
                  : "border-surface-2";

            return (
              <tr
                key={inst.id}
                onClick={() => onSelect(inst.id)}
                className={`cursor-pointer border-l-2 transition-colors hover:bg-surface-2/50 ${
                  isSelected
                    ? `bg-surface-2 ${riskColor}`
                    : "border-transparent"
                }`}
              >
                {/* Instance column */}
                <td className="px-3 py-2">
                  <div className="font-mono text-foreground">{inst.ip}</div>
                  <div className="text-[10px] text-foreground/40 truncate max-w-[180px]">
                    {inst.hostname}
                  </div>
                </td>

                {/* Cloud column */}
                <td className="px-3 py-2">
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-foreground/70">
                    {inst.cloud}
                  </span>
                </td>

                {/* Location column */}
                <td className="px-3 py-2 text-foreground/70">{inst.region}</td>

                {/* CVEs count */}
                <td className="px-3 py-2">
                  <span
                    className={
                      inst.cves.length >= 3
                        ? "text-verdict-block"
                        : inst.cves.length >= 1
                          ? "text-verdict-escalate"
                          : "text-verdict-allow"
                    }
                  >
                    {inst.cves.length}
                  </span>
                </td>

                {/* APT chips */}
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {inst.apts.length === 0 ? (
                      <span className="text-foreground/30">—</span>
                    ) : (
                      <>
                        {inst.apts.slice(0, 2).map((apt) => (
                          <span
                            key={apt}
                            className="rounded bg-verdict-block/15 px-1 py-0.5 text-[10px] text-verdict-block"
                          >
                            {apt}
                          </span>
                        ))}
                        {inst.apts.length > 2 && (
                          <span className="text-[10px] text-foreground/40">
                            +{inst.apts.length - 2}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </td>

                {/* Risk bar */}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full rounded-full ${
                          inst.risk_score >= 85
                            ? "bg-verdict-block"
                            : inst.risk_score >= 60
                              ? "bg-verdict-escalate"
                              : "bg-verdict-allow"
                        }`}
                        style={{ width: `${inst.risk_score}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-medium ${
                        inst.risk_score >= 85
                          ? "text-verdict-block"
                          : inst.risk_score >= 60
                            ? "text-verdict-escalate"
                            : "text-verdict-allow"
                      }`}
                    >
                      {inst.risk_score}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
