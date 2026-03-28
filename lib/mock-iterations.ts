import type { Iteration } from "./types";

export const MOCK_ITERATIONS: Iteration[] = [
  {
    id: "iter-baseline",
    label: "baseline",
    score: 62,
    delta: 0,
    mutation: "Initial rule set — 14 heuristic signals, static thresholds",
    timestamp: "2026-03-28T10:00:00Z",
  },
  {
    id: "iter-1",
    label: "iter-1",
    score: 71,
    delta: 9,
    mutation: "Reweighted typosquat distance threshold from 2→1, boosted low-download penalty",
    timestamp: "2026-03-28T11:15:00Z",
  },
  {
    id: "iter-2",
    label: "iter-2",
    score: 78,
    delta: 7,
    mutation: "Added slopsquat detector using LLM hallucination corpus (3 model families)",
    timestamp: "2026-03-28T12:30:00Z",
  },
  {
    id: "iter-3",
    label: "iter-3",
    score: 85,
    delta: 7,
    mutation: "Combined MCP auth-bypass signals with network exposure scoring",
    timestamp: "2026-03-28T13:45:00Z",
  },
];

export const NEXT_MUTATIONS: string[] = [
  "Fine-tune confidence weights for multi-agent consensus voting",
  "Expand typosquat corpus with npm/crates.io cross-ecosystem data",
  "Add temporal analysis — flag packages with install-time code changes",
  "Integrate EPSS scores as dynamic signal weights for CVE severity",
  "Lower false-positive rate on namespace collision heuristic",
  "Add maintainer reputation scoring based on package history graph",
];

let mutationIndex = 0;
let currentScore = 85;
let iterationCount = 3;

export function getIterations(): Iteration[] {
  return [...MOCK_ITERATIONS];
}

export function runNextIteration(): Iteration {
  const mutation = NEXT_MUTATIONS[mutationIndex % NEXT_MUTATIONS.length];
  mutationIndex++;
  iterationCount++;

  const delta = 2 + Math.floor(Math.random() * 4); // +2 to +5
  currentScore = Math.min(99, currentScore + delta);

  const iteration: Iteration = {
    id: `iter-${iterationCount}`,
    label: `iter-${iterationCount}`,
    score: currentScore,
    delta,
    mutation,
    timestamp: new Date().toISOString(),
  };

  MOCK_ITERATIONS.push(iteration);
  return iteration;
}

export function getCurrentScore(): number {
  return currentScore;
}
