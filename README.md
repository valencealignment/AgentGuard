# AgentGuard

A real-time security dashboard and self-improving firewall for detecting supply-chain attacks against AI agents. Built for the March 2026 hackathon.

AgentGuard combines three systems:

1. **WAASL Guard** -- a FastAPI rules engine that evaluates package installs, MCP connections, and API requests against an evolving YAML policy
2. **MERCK Loop** -- a mutation-based self-improvement engine that iteratively hardens the ruleset by testing against adversarial corpora
3. **AgentShield Dashboard** -- a Next.js monitoring UI that visualizes enforcement decisions, research iterations, threat intelligence, and escalation workflows

---

## Table of Contents

- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Running the Dashboard](#running-the-dashboard)
- [Running the Guard Backend](#running-the-guard-backend)
- [Running the Demo](#running-the-demo)
- [Running the Scenario Validation](#running-the-scenario-validation)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [How the MERCK Loop Works](#how-the-merck-loop-works)
- [How the Ralphthon Loop Works](#how-the-ralphthon-loop-works)
- [Design System](#design-system)

---

## Architecture

```
                          Browser
                            |
                     Next.js Dashboard (:3000)
                     /      |       \
          /api/score   /api/decisions   /api/autoresearcher/*
                |           |                    |
          [mock fallback]   |           [proxy with 3s timeout]
                            |                    |
                      mock-data.ts         Guard Backend (:8081)
                                           /       |       \
                                     POST /check  GET /metrics  GET /log
                                           |
                                     waasl-rules.yaml
                                           |
                                     MERCK Loop (mutations)
                                           |
                                  attacks/*.json + safe_packages/*.json
```

The dashboard never calls the guard backend directly from the browser. All guard communication goes through Next.js API routes (`app/api/`), which add timeout handling and fall back to mock data silently. If the guard is down, the dashboard keeps working.

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.12+ (for guard backend and demo scripts)
- PyYAML (`pip install pyyaml`)

### Install and run

```bash
# Clone and install
git clone https://github.com/valencealignment/AgentGuard.git
cd AgentGuard
npm install

# Start the dashboard (mock data mode -- no guard needed)
npm run dev
# Open http://localhost:3000/dashboard

# Run tests
npm test
```

This gives you a fully functional dashboard with mock data, drip-feed enforcement log, auto-researcher panel with rollback visualization, threat intelligence, and escalation workflows.

---

## Running the Dashboard

```bash
npm run dev        # Development server on :3000
npm run build      # Production build
npm run start      # Production server
```

Navigate to `http://localhost:3000/dashboard` to see:

- **Enforcement tab** -- real-time decision log (left), decision detail with agent-generated advisories (center), auto-researcher panel with iteration history and rollback visualization (right)
- **Threat-intel tab** -- exposed instance table with world map (left), instance detail with CVE data or package lookup (right)

The dashboard operates in two modes:

| Mode | How | What you see |
|------|-----|-------------|
| **Mock only** | `npm run dev` (no guard running) | Drip-feed of 20 mock decisions, 4 scenario validations, static iterations |
| **Live + fallback** | `npm run dev` with guard on :8081 | Real verdicts from guard, live MERCK metrics, falls back to mock if guard stops |

---

## Running the Guard Backend

The guard is a FastAPI server embedded in `merck_loop.py`. It evaluates actions against `waasl-rules.yaml` in real time.

```bash
# Start the guard + MERCK loop
python3 merck_loop.py --port 8081 --duration-hours 1

# Or just start the guard without the loop for a static ruleset
python3 merck_loop.py --port 8081 --duration-hours 0
```

The dashboard auto-connects to the guard. Set `GUARD_URL` if it runs on a different host (see [Environment Variables](#environment-variables)).

### Guard endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/check` | POST | Evaluate an action. Body: `{"action_type": "package_install", "target": "litellm==1.82.8", "signals": []}` |
| `/metrics` | GET | Current f1_score, catch_rate, false_pos_rate, total_iterations |
| `/log` | GET | Last 20 MERCK iteration records (JSONL) |
| `/rules` | GET | Current waasl-rules.yaml as JSON |
| `/status` | GET | Full service status with git snapshot |
| `/health` | GET | Health check |

### Example: check a package

```bash
curl -X POST http://localhost:8081/check \
  -H "Content-Type: application/json" \
  -d '{"action_type": "package_install", "target": "litellm==1.82.8"}'
```

Response:

```json
{
  "ok": true,
  "timestamp": "2026-03-28T22:00:00+00:00",
  "verdict": "block",
  "reason": "package_blocklist:litellm",
  "risk_score": 95,
  "action": {"id": "live-check", "action_type": "package_install", "target": "litellm==1.82.8", "signals": []}
}
```

---

## Running the Demo

### Live demo (8 scenarios, requires guard)

```bash
# Terminal 1: start the guard
python3 merck_loop.py --port 8081 --duration-hours 1

# Terminal 2: run the demo
python3 scripts/demo/live_demo.py
```

The live demo sends 8 scenarios through POST `/check`:

| # | Package / Target | Expected |
|---|-----------------|----------|
| 1 | requests==2.31.0 | ALLOW |
| 2 | litellm==1.82.8 | BLOCK |
| 3 | reqests==1.0.0 (typosquat) | BLOCK |
| 4 | openai-internal==0.0.1 (namespace squat) | BLOCK |
| 5 | sitecustomize-helper==0.3.1 (.pth persistence) | BLOCK |
| 6 | data-processor-utils==1.4.2 (credential theft) | BLOCK |
| 7 | MCP call to suspicious domain | BLOCK |
| 8 | fastapi==0.110.0 | ALLOW |

### Full demo walkthrough (dashboard + guard + live demo)

```bash
# Terminal 1: guard backend
python3 merck_loop.py --port 8081 --duration-hours 1

# Terminal 2: dashboard
npm run dev

# Terminal 3: live demo (optional -- sends real-time verdicts)
python3 scripts/demo/live_demo.py

# Open http://localhost:3000/dashboard
```

In the dashboard:

1. Click the **litellm==1.82.8** entry in the enforcement log -- the center panel shows the decision detail with an "Agent-Generated Advisory" section. This advisory was written autonomously by the MERCK research agent, not by a human.
2. Click **Run Iteration** in the auto-researcher panel -- watch the score climb. Approximately 1 in 5 iterations will show a red "rolled back" row, proving the system self-corrects when a mutation makes things worse.
3. Switch to the **Threat Intel** tab -- click an exposed instance on the world map to see CVE details, APT attribution, and credential leak data.
4. Click a scenario validation entry (ESCALATE/WARN) to see the escalation panel with pending human-approval requests.

---

## Running the Scenario Validation

The scenario runner produces deterministic demo artifacts from 4 canonical scenarios without requiring the guard backend.

```bash
# Run once and produce artifacts
python3 scripts/demo/run_demo.py

# Or run with watch mode (refreshes every 60s)
python3 services/demo-validation/scenario_runner.py --watch --interval 60

# Run with CLAIM event for lane coordination
python3 services/demo-validation/scenario_runner.py --emit-claim
```

### Canonical scenarios

| ID | Title | Decision | Severity |
|----|-------|----------|----------|
| scenario-a | Clean allow path (trusted agent, file read) | ALLOW | info |
| scenario-b | LiteLLM risky path (flagged package install) | BLOCK | high |
| scenario-c | Poor-reputation external agent | BLOCK | critical |
| scenario-d | Remediation follow-through (depends on B) | ALLOW | warning |

Artifacts written to:

```
ops/reports/demo/
  scenario-a-clean-allow/report.json, trace.json
  scenario-b-litellm-risk/report.json, trace.json
  scenario-c-poor-reputation-external-agent/report.json, trace.json
  scenario-d-remediation-follow-through/report.json, trace.json
  latest-run.json
  domain-events.json
  summary.md
ops/events/demo.jsonl
ops/status/demo.json
```

These artifacts are consumed by the dashboard:

- Scenario reports become decisions in the enforcement log (via `/api/scenarios`)
- Scenario traces become threads viewable from decision detail (via `/api/threads/[id]`)
- Scenario notifications with `human-approval-queue` become pending escalations in the escalation panel

---

## API Reference

### Dashboard API routes (Next.js, port 3000)

All routes are server-side. The browser only talks to these, never directly to the guard.

| Route | Method | Description |
|-------|--------|-------------|
| `/api/decisions?since=<ISO>` | GET | Drip-feed enforcement decisions (mock data) |
| `/api/score` | GET | Policy score, catch rate, FP rate. Proxies to guard `/metrics`, falls back to mock |
| `/api/iterations` | GET | MERCK iteration history. Proxies to guard `/log`, falls back to mock |
| `/api/iterations/run` | POST | Trigger a mock iteration (demo only) |
| `/api/scenarios` | GET | Scenario validation decisions from `ops/reports/demo/` |
| `/api/escalations/[id]` | GET | Escalation report by ID |
| `/api/escalations/[id]/review` | POST | Approve or deny an escalation |
| `/api/threads/[id]` | GET | Thread messages (mock threads + scenario traces) |
| `/api/threat-intel/instances` | GET | Exposed instances dataset |
| `/api/threat-intel/lookup?name=<pkg>&version=<ver>` | GET | Live package lookup via deps.dev + OSV |
| `/api/autoresearcher/check` | POST | Proxy to guard `/check` with mock fallback |
| `/api/autoresearcher/advisory?target=<pkg>` | GET | Agent-generated advisory markdown from `ops/reports/blogs/` |
| `/api/autoresearcher/status` | GET | Guard status |

---

## Project Structure

```
AgentGuard/
  app/
    dashboard/page.tsx          # Main dashboard page
    globals.css                 # Dark theme + Tailwind design tokens
    api/
      autoresearcher/           # Guard proxy routes (check, advisory, status)
      decisions/                # Drip-feed enforcement decisions
      escalations/[id]/         # Escalation reports + review workflow
      iterations/               # MERCK iteration history (live + mock)
      scenarios/                # Scenario validation decisions
      score/                    # Policy score (live + mock)
      threads/[id]/             # Thread views (mock + scenario traces)
      threat-intel/             # Exposed instances + package lookup

  components/
    dashboard/                  # Enforcement UI (9 components)
      TopBar.tsx                #   Score bar
      TabBar.tsx                #   Tab navigation
      EnforcementLog.tsx        #   Decision list with drip-feed animation
      DecisionDetail.tsx        #   Detail panel + advisory markdown renderer
      EscalationPanel.tsx       #   Human-approval review panel
      AutoResearcherPanel.tsx   #   Iteration history with rollback display
      VerdictBadge.tsx          #   BLOCK/ALLOW/ESCALATE/WARN badges
      SignalChip.tsx            #   Evidence signal chips
      CountdownTimer.tsx        #   Countdown display
    threat-intel/               # Threat intelligence UI (7 components)
      WorldMap.tsx              #   Equirectangular projection
      ExposedInstanceTable.tsx  #   Instance list
      InstanceDetail.tsx        #   CVE + APT detail
      CveTable.tsx              #   CVE detail table
      AptBadge.tsx              #   APT group badges
      CrossReferenceCallout.tsx #   Cross-tab navigation
      PackageLookup.tsx         #   Live package search

  lib/
    types.ts                    # 18 TypeScript interfaces (Decision, Iteration, Thread, ...)
    constants.ts                # Verdict colors, signal categories, APT descriptions
    guard-client.ts             # HTTP client for guard backend (timeout, fallback)
    guard-transforms.ts         # Backend → dashboard type transforms
    scenario-transforms.ts      # Scenario report → Decision/Thread/Escalation transforms
    mock-data.ts                # 20 mock decisions with drip-feed mechanism
    mock-escalations.ts         # Escalation reports (mock + scenario-derived)
    mock-iterations.ts          # Iteration history with rollback simulation
    risk-score.ts               # 6-factor weighted risk scoring engine
    golden-dataset.ts           # 8 exposed instances with geo/CVE/APT data
    use-decisions.ts            # React polling hook for decisions
    use-score.ts                # React polling hook for score
    api-utils.ts                # deps.dev + OSV API clients
    intel-cache.ts              # Package intelligence cache

  merck_loop.py                 # MERCK self-improvement loop + FastAPI guard (1164 lines)
  waasl-rules.yaml              # WAASL policy rules (214 lines)
  attacks/
    known_malicious.json        # 10 hand-curated attack samples
    generated.json              # MERCK-generated attacks
    generated_adversarial.json  # 45 Ralphthon adversarial cases
  safe_packages/
    known_good.json             # 8 known-safe packages
    generated.json              # MERCK-generated safe cases

  ops/
    ralphthon_loop.py           # Adversarial test generator
    reports/
      blogs/                    # Agent-generated advisories
        litellm-supply-chain-advisory.md
      demo/                     # Scenario validation artifacts
        scenario-*/report.json, trace.json
        latest-run.json
        domain-events.json
    events/demo.jsonl           # Lane event log
    status/                     # Lane status files

  packages/
    policy-engine/              # Python wrapper around merck_loop evaluation
    research-engine/            # Test case generation + advisory writing
    demo-scenarios/             # Canonical scenario definitions
    contracts/                  # Event schema definitions

  scripts/demo/
    live_demo.py                # 8-scenario live demo (requires guard)
    run_demo.py                 # Scenario validation runner entrypoint

  services/demo-validation/
    scenario_runner.py          # Deterministic scenario runner (504 lines)
    tests/                      # Python tests for scenario runner

  vitest.config.ts              # Test configuration
  tsconfig.json                 # TypeScript configuration
  package.json                  # Dependencies and scripts
```

---

## Testing

### JavaScript / TypeScript tests (Vitest)

```bash
npm test                    # Run all 116 tests
npx vitest run --reporter=verbose   # Verbose output
npx vitest watch            # Watch mode
```

Test coverage:

| Category | Tests | What's covered |
|----------|-------|---------------|
| Risk scoring | 20 | 6-factor weighted composite, verdict thresholds, edge cases |
| Mock data | 12 | Drip-feed mechanism, cursor advancement, reset |
| Mock iterations | 10 | Rollback simulation, score capping, mutation cycling |
| Guard transforms | 14 | Verdict case conversion, log→iteration, metrics→score, check→decision |
| Scenario transforms | 25 | Report→decision, trace→thread, notification→escalation, verdict mapping |
| UI: VerdictBadge | 5 | All verdict types render correctly |
| UI: SignalChip | 6 | Signal categories, formatting |
| UI: AutoResearcherPanel | 13 | Score display, sparkline, rollback rows, run button |
| UI: DecisionDetail | 11 | Advisory rendering, markdown, signals, real attack callout |

### Python tests

```bash
python3 -m pytest services/demo-validation/tests/ -v
```

---

## Environment Variables

Create `.env.local` in the project root:

```bash
# Guard backend URL (default: http://localhost:8081)
GUARD_URL=http://localhost:8081

# For GCP VM deployment:
# GUARD_URL=http://8.229.235.221:8081
```

| Variable | Default | Description |
|----------|---------|-------------|
| `GUARD_URL` | `http://localhost:8081` | Base URL for the WAASL guard backend. The dashboard proxies all guard requests through Next.js API routes with a 3-second timeout. |

---

## How the MERCK Loop Works

MERCK (Mutation-Evaluated Rule Composition Kernel) iteratively improves the WAASL ruleset:

```
Load rules from waasl-rules.yaml
Load attack corpus (known_malicious + generated + adversarial)
Load safe corpus (known_good + generated)

For each iteration:
  1. Choose a mutation strategy:
     - Add package to blocklist
     - Enable typosquatting detection
     - Add behavioral signal rule
     - Add MCP endpoint rule
     - Add domain/regex pattern
     - Adjust reputation thresholds
  2. Apply mutation to rules
  3. Evaluate mutated rules against full corpus
  4. If f1_score improved and false_pos_rate acceptable:
       → KEEP mutation, commit to git
     Else:
       → REVERT mutation (rolled back)
  5. Log result to merck_results.jsonl
  6. Report progress
```

The loop's git history shows repeated break-recover cycles:

```
MERCK iter 1:  f1=0.59  mutation=blocklist litellm==1.82.7
MERCK iter 2:  f1=0.65  mutation=blocklist reqeusts==1.0.0
...
MERCK iter 12: f1=0.96  mutation=block_if signal opens_network_socket
MERCK iter 13: f1=1.00  mutation=domain blocklist collect-data.evil.com
```

Current guard metrics: f1=1.0, catch_rate=1.0, false_pos_rate=0.0 across 10 known attacks, 45 adversarial cases, and 8 safe packages.

### CLI options

```bash
python3 merck_loop.py \
  --port 8081 \           # FastAPI server port
  --duration-hours 3 \    # How long to run the loop
  --progress-seconds 1800 \  # Progress report interval
  --seed 7                # Random seed for reproducibility
```

---

## How the Ralphthon Loop Works

The Ralphthon loop generates adversarial test cases that challenge the current rules:

```bash
python3 ops/ralphthon_loop.py --until-epoch <unix_timestamp> --sleep-seconds 75
```

It rotates through 7 adversarial categories:

- **Combosquatting** -- legitimate-sounding compound names (requests-async, numpy-cuda)
- **Slopsquatting** -- AI-hallucinated package names registered by attackers
- **Behavioral signals** -- crontab writing, bashrc modification, credential reading
- **MCP rug-pulls** -- tool description changes after initial trust
- **Dependency confusion** -- internal namespace squatting
- **PyC hiding** -- bytecode payload persistence
- **Steganography** -- data hidden in image/binary payloads

Each cycle: generate 5 adversarial cases, test against current rules, run MERCK to recover, commit the break-recover checkpoint to git.

---

## Design System

The dashboard uses a dark theme with semantic color tokens defined in `app/globals.css`:

| Token | Color | Usage |
|-------|-------|-------|
| `--color-verdict-block` | #ef4444 (red) | BLOCK verdicts, rolled-back iterations |
| `--color-verdict-allow` | #22c55e (green) | ALLOW verdicts, positive deltas |
| `--color-verdict-escalate` | #f59e0b (amber) | ESCALATE/WARN verdicts |
| `--color-surface-0` | #0a0e14 | Page background |
| `--color-surface-1` | #111620 | Card backgrounds |
| `--color-surface-2` | #181c22 | Input/row backgrounds |
| `--color-signal-critical` | #ef4444 | Critical signals |
| `--color-signal-info` | #3b82f6 (blue) | Info signals, accent |

Stack: Next.js 16, React 19, Tailwind CSS 4, TypeScript 5, Vitest 4.
