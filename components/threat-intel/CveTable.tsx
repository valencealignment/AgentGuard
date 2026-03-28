import type { CveDetail } from "@/lib/types";

interface CveTableProps {
  cveIds: string[];
  cveDetails: Record<string, CveDetail>;
}

export function CveTable({ cveIds, cveDetails }: CveTableProps) {
  if (cveIds.length === 0) {
    return (
      <p className="text-xs text-foreground/40">No known CVEs associated</p>
    );
  }

  const rows = cveIds
    .map((id) => cveDetails[id])
    .filter(Boolean)
    .sort((a, b) => b.epss - a.epss);

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-surface-2 text-left text-foreground/50">
          <th className="px-2 py-1.5 font-medium">CVE</th>
          <th className="px-2 py-1.5 font-medium">CVSS</th>
          <th className="px-2 py-1.5 font-medium">EPSS</th>
          <th className="px-2 py-1.5 font-medium">Description</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-surface-2">
        {rows.map((cve) => (
          <tr
            key={cve.id}
            className={cve.epss > 0.7 ? "bg-verdict-block/5" : ""}
          >
            <td className="px-2 py-1.5 font-mono text-accent-blue">
              {cve.id}
            </td>
            <td className="px-2 py-1.5">
              <span
                className={
                  cve.cvss >= 9
                    ? "text-verdict-block"
                    : cve.cvss >= 7
                      ? "text-verdict-escalate"
                      : "text-foreground/70"
                }
              >
                {cve.cvss.toFixed(1)}
              </span>
            </td>
            <td className="px-2 py-1.5">
              <span
                className={
                  cve.epss > 0.7
                    ? "font-semibold text-verdict-block"
                    : "text-foreground/70"
                }
              >
                {(cve.epss * 100).toFixed(0)}%
              </span>
            </td>
            <td className="px-2 py-1.5 text-foreground/70">{cve.summary}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
