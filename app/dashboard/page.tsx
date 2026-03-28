"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "@/components/dashboard/TopBar";
import TabBar from "@/components/dashboard/TabBar";
import EnforcementLog from "@/components/dashboard/EnforcementLog";
import DecisionDetail from "@/components/dashboard/DecisionDetail";
import { EscalationPanel } from "@/components/dashboard/EscalationPanel";
import AutoResearcherPanel from "@/components/dashboard/AutoResearcherPanel";
import { ExposedInstanceTable } from "@/components/threat-intel/ExposedInstanceTable";
import WorldMap from "@/components/threat-intel/WorldMap";
import { InstanceDetail } from "@/components/threat-intel/InstanceDetail";
import { PackageLookup } from "@/components/threat-intel/PackageLookup";
import { useDecisions } from "@/lib/use-decisions";
import { useScore } from "@/lib/use-score";
import { GOLDEN_INSTANCES, CVE_DETAILS } from "@/lib/golden-dataset";
import { APT_DESCRIPTIONS } from "@/lib/constants";
import type { Iteration, EscalationReport } from "@/lib/types";

type Tab = "enforcement" | "threat-intel";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("enforcement");
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  const { decisions, newIds } = useDecisions();
  const score = useScore();
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [escalation, setEscalation] = useState<EscalationReport | null>(null);

  useEffect(() => {
    fetch("/api/iterations")
      .then((r) => r.json())
      .then((data: Iteration[]) => setIterations(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDecisionId && decisions.length > 0) {
      setSelectedDecisionId(decisions[0].id);
    }
  }, [decisions, selectedDecisionId]);

  const handleRunIteration = useCallback(async () => {
    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 1800));
    try {
      const res = await fetch("/api/iterations/run", { method: "POST" });
      if (res.ok) {
        const iter: Iteration = await res.json();
        setIterations((prev) => [...prev, iter]);
      }
    } catch {
      // ignore
    }
    setIsRunning(false);
  }, []);

  // Find the selected decision
  const selectedDecision = useMemo(
    () => decisions.find((d) => d.id === selectedDecisionId) ?? null,
    [decisions, selectedDecisionId]
  );

  // Find the selected instance
  const selectedInstance = useMemo(
    () => GOLDEN_INSTANCES.find((i) => i.id === selectedInstanceId) ?? null,
    [selectedInstanceId]
  );

  // Fetch escalation report when an ESCALATE/WARN decision is selected
  useEffect(() => {
    if (!selectedDecision || (selectedDecision.verdict !== "ESCALATE" && selectedDecision.verdict !== "WARN")) {
      setEscalation(null);
      return;
    }
    const escId = `esc-${selectedDecision.target.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`;
    fetch(`/api/escalations/${escId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setEscalation(data))
      .catch(() => setEscalation(null));
  }, [selectedDecision]);

  // Cross-reference: threat-intel -> enforcement
  const handleEnforcementRef = useCallback(
    (ref: string) => {
      const match = decisions.find(
        (d) => d.id === ref || d.target.includes(ref)
      );
      if (match) {
        setSelectedDecisionId(match.id);
        setActiveTab("enforcement");
      }
    },
    [decisions]
  );

  // Cross-reference: enforcement -> threat-intel (known exposure)
  const handleExposureClick = useCallback((ip: string) => {
    const match = GOLDEN_INSTANCES.find((i) => i.ip === ip);
    if (match) {
      setSelectedInstanceId(match.id);
      setActiveTab("threat-intel");
    }
  }, []);

  const isEscalation =
    selectedDecision?.verdict === "ESCALATE" || selectedDecision?.verdict === "WARN";

  return (
    <div className="flex h-screen flex-col bg-surface-0 text-foreground">
      <TopBar score={score} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex min-h-0 flex-1">
        {activeTab === "enforcement" ? (
          <div className="flex flex-1">
            {/* 45% Enforcement Log */}
            <section className="flex w-[45%] flex-col border-r border-surface-2 p-4 overflow-hidden">
              <EnforcementLog
                decisions={decisions}
                newIds={newIds}
                selectedId={selectedDecisionId}
                onSelect={setSelectedDecisionId}
                onExposureClick={handleExposureClick}
              />
            </section>
            {/* 35% Decision Detail / Escalation Panel */}
            <section className="w-[35%] border-r border-surface-2 overflow-y-auto">
              {isEscalation && escalation ? (
                <EscalationPanel
                  key={escalation.id}
                  report={escalation}
                />
              ) : (
                <DecisionDetail
                  key={selectedDecisionId}
                  decision={selectedDecision}
                />
              )}
            </section>
            {/* 20% AutoResearcher */}
            <section className="flex w-[20%] flex-col overflow-hidden">
              <AutoResearcherPanel
                score={score}
                iterations={iterations}
                onRunIteration={handleRunIteration}
                isRunning={isRunning}
              />
            </section>
          </div>
        ) : (
          <div className="flex flex-1">
            {/* 45% Instance Table + Map */}
            <section className="flex w-[45%] flex-col border-r border-surface-2 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4">
                <ExposedInstanceTable
                  instances={GOLDEN_INSTANCES}
                  selectedId={selectedInstanceId}
                  onSelect={setSelectedInstanceId}
                />
              </div>
              <div className="h-[200px] shrink-0 border-t border-surface-2 p-2">
                <WorldMap
                  instances={GOLDEN_INSTANCES}
                  selectedId={selectedInstanceId}
                  onSelect={setSelectedInstanceId}
                />
              </div>
            </section>
            {/* 55% Instance Detail / Package Lookup */}
            <section className="flex w-[55%] flex-col overflow-y-auto">
              {selectedInstance ? (
                <InstanceDetail
                  key={selectedInstance.id}
                  instance={selectedInstance}
                  cveDetails={CVE_DETAILS}
                  aptDescriptions={APT_DESCRIPTIONS}
                  onEnforcementRef={handleEnforcementRef}
                />
              ) : (
                <PackageLookup />
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
