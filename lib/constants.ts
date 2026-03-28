import type { Verdict } from "./types";

// Verdict colors — used for badges, borders, and accents
export const VERDICT_COLORS: Record<Verdict, { bg: string; text: string; border: string }> = {
  BLOCK: { bg: "bg-verdict-block/15", text: "text-verdict-block", border: "border-verdict-block" },
  ALLOW: { bg: "bg-verdict-allow/15", text: "text-verdict-allow", border: "border-verdict-allow" },
  ESCALATE: { bg: "bg-verdict-escalate/15", text: "text-verdict-escalate", border: "border-verdict-escalate" },
  WARN: { bg: "bg-verdict-warn/15", text: "text-verdict-warn", border: "border-verdict-warn" },
};

// Signal categories
export type SignalCategory = "critical" | "warning" | "info";

export const SIGNAL_CATEGORY_COLORS: Record<SignalCategory, { bg: string; text: string }> = {
  critical: { bg: "bg-signal-critical/15", text: "text-signal-critical" },
  warning: { bg: "bg-signal-warning/15", text: "text-signal-warning" },
  info: { bg: "bg-signal-info/15", text: "text-signal-info" },
};

// Map each signal to its category
export const SIGNAL_TO_CATEGORY: Record<string, SignalCategory> = {
  // Critical signals
  "known_malicious": "critical",
  "typosquat_detected": "critical",
  "slopsquat_detected": "critical",
  "malicious_code_pattern": "critical",
  "mcp_auth_bypass": "critical",
  "mcp_injection": "critical",
  "supply_chain_attack": "critical",
  "credential_exfiltration": "critical",
  "remote_code_execution": "critical",

  // Warning signals
  "low_download_count": "warning",
  "recent_creation": "warning",
  "version_mismatch": "warning",
  "suspicious_maintainer": "warning",
  "unusual_dependencies": "warning",
  "no_source_repo": "warning",
  "obfuscated_code": "warning",
  "excessive_permissions": "warning",
  "mcp_unverified_server": "warning",

  // Info signals
  "first_seen": "info",
  "namespace_collision": "info",
  "deprecated_version": "info",
  "license_change": "info",
  "maintainer_change": "info",
  "pypi_available": "info",
  "pypi_yanked": "info",
};

// APT group descriptions
export const APT_DESCRIPTIONS: Record<string, string> = {
  "APT28": "Russian military intelligence (GRU Unit 26165), also known as Fancy Bear",
  "APT29": "Russian SVR foreign intelligence, also known as Cozy Bear",
  "APT37": "North Korean group targeting South Korean entities and cryptocurrency",
  "APT41": "Chinese state-sponsored group conducting espionage and financially-motivated activity",
  "Lazarus Group": "North Korean state-sponsored group, known for financial theft and espionage",
  "APT34": "Iranian Ministry of Intelligence group targeting Middle East organizations",
  "Salt Typhoon": "Chinese state-sponsored group infiltrating telecom infrastructure",
  "Turla": "Russian FSB-attributed group known for sophisticated backdoors and satellite hijacking",
  "Kimsuky": "North Korean group focused on intelligence gathering via spear-phishing",
  "Sandworm": "Russian GRU Unit 74455, responsible for destructive cyberattacks on critical infrastructure",
};
