import type { Verdict } from "@/lib/types";
import { VERDICT_COLORS } from "@/lib/constants";

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const colors = VERDICT_COLORS[verdict];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${colors.bg} ${colors.text}`}
    >
      {verdict}
    </span>
  );
}
