import { APT_DESCRIPTIONS } from "@/lib/constants";

interface AptBadgeProps {
  apt: string;
}

export default function AptBadge({ apt }: AptBadgeProps) {
  const description = APT_DESCRIPTIONS[apt];

  return (
    <span
      className="inline-flex items-center rounded bg-signal-critical/15 px-2 py-0.5 text-[10px] font-semibold text-signal-critical"
      title={description}
    >
      {apt}
    </span>
  );
}
