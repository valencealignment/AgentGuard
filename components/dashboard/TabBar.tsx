type Tab = "enforcement" | "threat-intel";

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "enforcement", label: "Enforcement Log" },
  { id: "threat-intel", label: "Threat Intel" },
];

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="flex shrink-0 border-b border-surface-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === tab.id
              ? "border-b-2 border-accent-blue text-foreground"
              : "border-b-2 border-transparent text-foreground/50 hover:text-foreground/70"
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
