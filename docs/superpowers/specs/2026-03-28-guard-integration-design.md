# Guard Backend Integration Design

Date: 2026-03-28

## Problem

The AgentShield dashboard runs entirely on mock data. The teammate's PR added a FastAPI guard on `:8081` with live verdict, metrics, and iteration log endpoints. We need to connect them with a proxy pattern that keeps the dashboard working when the guard is down.

## Architecture

Three modules with clean separation:

```
lib/guard-client.ts        # HTTP — fetch with timeout, env-based URL, silent fallback
lib/guard-transforms.ts    # Pure — backend shapes to dashboard types
app/api/autoresearcher/*/  # Proxy routes — client + transform + mock fallback
```

### guard-client.ts

- Reads `GUARD_URL` env var (default `http://localhost:8081`, GCP: `http://8.229.235.221:8081`)
- Single `guardFetch<T>(path, options?)` function
- 3-second timeout via `AbortSignal.timeout(3000)`
- Returns `T | null` — null means "backend unreachable, use mock"
- No retry logic (the dashboard polls every few seconds anyway)

### guard-transforms.ts

Pure functions, no side effects, fully unit-testable:

| Function | Input (backend) | Output (dashboard) |
|----------|-----------------|-------------------|
| `transformVerdict(v)` | `"block"` | `"BLOCK"` |
| `transformLogRecord(rec)` | `{iteration, f1_score, mutation, result: "kept"\|"reverted", ...}` | `Iteration` with `kept: boolean` |
| `transformMetrics(m)` | `{f1_score, catch_rate, false_pos_rate, total_iterations, best_f1}` | `ScoreResponse` |
| `transformCheckResult(r)` | `{verdict, reason, risk_score, action}` | Partial `Decision`-compatible object |

### Proxy Routes

All under `app/api/autoresearcher/`:

| Route | Method | Backend | Fallback |
|-------|--------|---------|----------|
| `check/route.ts` | POST | `/check` | error response (no mock for live checks) |
| `metrics/route.ts` | GET | `/metrics` | mock from `getCurrentScore()` |
| `log/route.ts` | GET | `/log` | mock from `getIterations()` |
| `status/route.ts` | GET | `/status` | `{ ok: false }` |
| `advisory/route.ts` | GET `?target=litellm` | reads `ops/reports/blogs/` | `null` |

### Type Changes

```typescript
// Iteration — add kept field
export interface Iteration {
  id: string;
  label: string;
  score: number;
  delta: number;
  mutation: string;
  timestamp: string;
  kept: boolean;  // NEW — false = rolled back
}

// Decision — add optional advisory
export interface Decision {
  // ... existing fields ...
  advisory_md?: string;  // NEW — agent-generated blog advisory markdown
}
```

### UI Changes

**AutoResearcherPanel:** Iteration rows with `kept === false` get:
- Red background tint (`bg-verdict-block/10`)
- Red text
- Suffix: "rolled back" with cross mark

**DecisionDetail:** When `advisory_md` is present:
- New "Advisory" section below existing content
- Renders markdown as styled HTML
- Label: "Agent-Generated Advisory" to make provenance clear

### Env Config

```env
# .env.local
GUARD_URL=http://localhost:8081        # local dev (default)
# GUARD_URL=http://8.229.235.221:8081  # GCP VM
```

### Existing Route Updates

- `app/api/iterations/route.ts` — try `guardFetch('/log')` + transform, fall back to mock
- `app/api/score/route.ts` — try `guardFetch('/metrics')` + transform, fall back to mock

## Testing

- Unit tests for all `guard-transforms.ts` functions
- Unit tests for AutoResearcherPanel rolled-back rendering
- Unit tests for DecisionDetail advisory rendering
