const GUARD_URL = process.env.GUARD_URL ?? "http://localhost:8081";
const TIMEOUT_MS = 3_000;

/**
 * Fetch from the guard backend with timeout.
 * Returns parsed JSON on success, null on any failure (timeout, network, non-2xx).
 * Callers fall back to mock data when null is returned.
 */
export async function guardFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    const url = `${GUARD_URL}${path}`;
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function getGuardUrl(): string {
  return GUARD_URL;
}
