interface CrossReferenceCalloutProps {
  label: string;
  targetId: string;
  onClick: (id: string) => void;
}

export function CrossReferenceCallout({
  label,
  targetId,
  onClick,
}: CrossReferenceCalloutProps) {
  return (
    <button
      onClick={() => onClick(targetId)}
      className="w-full rounded border border-accent-blue/30 bg-accent-blue/10 px-3 py-2 text-left text-xs text-accent-blue transition-colors hover:bg-accent-blue/20"
    >
      <span className="font-semibold">{label}</span>
      <span className="ml-1 text-accent-blue/60">
        Click to view in enforcement log
      </span>
    </button>
  );
}
