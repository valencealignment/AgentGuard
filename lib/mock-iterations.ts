import type { Iteration } from "./types";

const MOCK_ITERATIONS: Iteration[] = [
  {
    id: "iter-baseline",
    label: "baseline",
    score: 62,
    delta: 0,
    mutation: "Initial rule set — 14 heuristic signals, static thresholds",
    timestamp: "2026-03-28T10:00:00Z",
    kept: true,
  },
  {
    id: "iter-1",
    label: "iter-1",
    score: 71,
    delta: 9,
    mutation: "Reweighted typosquat distance threshold from 2→1, boosted low-download penalty",
    timestamp: "2026-03-28T11:15:00Z",
    kept: true,
  },
  {
    id: "iter-2",
    label: "iter-2",
    score: 78,
    delta: 7,
    mutation: "Added slopsquat detector using LLM hallucination corpus (3 model families)",
    timestamp: "2026-03-28T12:30:00Z",
    kept: true,
  },
  {
    id: "iter-2b",
    label: "iter-2b",
    score: 74,
    delta: -4,
    mutation: "Aggressive namespace-collision heuristic — increased false positives on internal packages",
    timestamp: "2026-03-28T12:48:00Z",
    kept: false,
  },
  {
    id: "iter-3",
    label: "iter-3",
    score: 85,
    delta: 7,
    mutation: "Combined MCP auth-bypass signals with network exposure scoring",
    timestamp: "2026-03-28T13:45:00Z",
    kept: true,
  },
  {
    id: "iter-4",
    label: "iter-4",
    score: 89,
    delta: 4,
    mutation: "Blocklist requests-async, jwt-secure-validator; block writes_crontab signal",
    timestamp: "2026-03-28T22:01:12Z",
    kept: true,
  },
  {
    id: "iter-5",
    label: "iter-5",
    score: 92,
    delta: 3,
    mutation: "Blocklist numpy-cuda, fastapi-middleware-core; block modifies_bashrc signal",
    timestamp: "2026-03-28T22:03:14Z",
    kept: true,
  },
  {
    id: "iter-5b",
    label: "iter-5b",
    score: 88,
    delta: -4,
    mutation: "Broad regex pattern blocked legitimate internal packages",
    timestamp: "2026-03-28T22:03:50Z",
    kept: false,
  },
  {
    id: "iter-6",
    label: "iter-6",
    score: 95,
    delta: 3,
    mutation: "Block pyc hidden loaders, stego payloads; blocklist flask-admin-tools",
    timestamp: "2026-03-28T22:04:37Z",
    kept: true,
  },
  {
    id: "iter-7",
    label: "iter-7",
    score: 97,
    delta: 2,
    mutation: "MCP rug-pull detection for notion-sync, corp-secrets-sdk blocklist",
    timestamp: "2026-03-28T22:05:57Z",
    kept: true,
  },
  {
    id: "iter-8",
    label: "iter-8",
    score: 99,
    delta: 2,
    mutation: "MCP rug-pull detection for github-agent-tools; block shell_rc modification",
    timestamp: "2026-03-28T22:07:19Z",
    kept: true,
  },
  {
    id: "iter-9",
    label: "iter-9",
    score: 100,
    delta: 1,
    mutation: "Final tuning — 89 attacks, 18 safe cases, 0 false positives. F1=1.0",
    timestamp: "2026-03-28T22:10:04Z",
    kept: true,
  },
];

export const NEXT_MUTATIONS: string[] = [
  "Expand typosquat corpus with npm/crates.io cross-ecosystem data",
  "Add temporal analysis — flag packages with install-time code changes",
  "Integrate EPSS scores as dynamic signal weights for CVE severity",
  "Add maintainer reputation scoring based on package history graph",
  "Fine-tune confidence weights for multi-agent consensus voting",
  "Cross-registry dependency chain analysis for transitive risks",
];

let mutationIndex = 0;
let currentScore = 100;
let iterationCount = 9;

export function getIterations(): Iteration[] {
  return [...MOCK_ITERATIONS];
}

const ROLLBACK_MUTATIONS: string[] = [
  "Aggressive namespace-collision heuristic — increased false positives",
  "Broad regex pattern blocked legitimate internal packages",
  "Overfitted MCP domain rule caught valid developer tools",
];

export function runNextIteration(): Iteration {
  iterationCount++;

  // ~20% chance of a rolled-back iteration
  const isRollback = Math.random() < 0.2;

  if (isRollback) {
    const rollbackMutation = ROLLBACK_MUTATIONS[mutationIndex % ROLLBACK_MUTATIONS.length];
    mutationIndex++;
    const negativeDelta = -(2 + Math.floor(Math.random() * 4));
    const rollbackScore = Math.max(50, currentScore + negativeDelta);

    const iteration: Iteration = {
      id: `iter-${iterationCount}`,
      label: `iter-${iterationCount}`,
      score: rollbackScore,
      delta: negativeDelta,
      mutation: rollbackMutation,
      timestamp: new Date().toISOString(),
      kept: false,
    };

    MOCK_ITERATIONS.push(iteration);
    // Score stays at currentScore since the rollback was reverted
    return iteration;
  }

  const mutation = NEXT_MUTATIONS[mutationIndex % NEXT_MUTATIONS.length];
  mutationIndex++;

  const delta = 2 + Math.floor(Math.random() * 4);
  currentScore = Math.min(100, currentScore + delta);

  const iteration: Iteration = {
    id: `iter-${iterationCount}`,
    label: `iter-${iterationCount}`,
    score: currentScore,
    delta,
    mutation,
    timestamp: new Date().toISOString(),
    kept: true,
  };

  MOCK_ITERATIONS.push(iteration);
  return iteration;
}

export function getCurrentScore(): number {
  return currentScore;
}
