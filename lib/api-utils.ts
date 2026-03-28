const API_TIMEOUT = 3000;

export interface DepsDevPackage {
  packageKey: {
    system: string;
    name: string;
  };
  version?: string;
  licenses?: string[];
  dependencyCount?: number;
}

export interface OsvVulnerability {
  id: string;
  summary?: string;
  details?: string;
  severity?: { type: string; score: string }[];
  affected?: { package: { name: string; ecosystem: string } }[];
}

export async function fetchDepsDevPackage(
  name: string,
  version?: string,
): Promise<DepsDevPackage | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const versionPath = version ? `/versions/${encodeURIComponent(version)}` : "";
    const url = `https://api.deps.dev/v3alpha/systems/pypi/packages/${encodeURIComponent(name)}${versionPath}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as DepsDevPackage;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchOsvVulns(
  name: string,
  version?: string,
): Promise<OsvVulnerability[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const res = await fetch("https://api.osv.dev/v1/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        package: { name, ecosystem: "PyPI" },
        ...(version && { version }),
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { vulns?: OsvVulnerability[] };
    return data.vulns ?? [];
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
