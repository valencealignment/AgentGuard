import { SIGNAL_TO_CATEGORY, SIGNAL_CATEGORY_COLORS } from "@/lib/constants";

export function SignalChip({ signal }: { signal: string }) {
  const category = SIGNAL_TO_CATEGORY[signal] ?? "info";
  const colors = SIGNAL_CATEGORY_COLORS[category];
  const label = signal.replace(/_/g, " ");
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text}`}
    >
      {label}
    </span>
  );
}
