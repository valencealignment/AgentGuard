import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { contracts } from "../../packages/contracts/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const webRoot = path.join(root, "apps", "web");
const host = process.env.WAAL_API_HOST || "127.0.0.1";
const port = Number(process.env.WAAL_API_PORT || 8787);

function safeReadJson(relPath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relPath), "utf8"));
  } catch {
    return fallback;
  }
}

function safeReadJsonl(relPath, limit = 50) {
  try {
    const contents = fs.readFileSync(path.join(root, relPath), "utf8").trim();
    if (!contents) {
      return [];
    }
    return contents
      .split("\n")
      .filter(Boolean)
      .slice(-limit)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

function collectStatuses() {
  return {
    integration: safeReadJson("ops/status/integration.json", {}),
    ui: safeReadJson("ops/status/ui.json", {}),
    security: safeReadJson("ops/status/security.json", {}),
    demo: safeReadJson("ops/status/demo.json", {}),
    aggregate: safeReadJson("ops/status/aggregate.json", {})
  };
}

function collectEvents(lane = null, limit = 50) {
  if (lane) {
    return safeReadJsonl(`ops/events/${lane}.jsonl`, limit);
  }
  return {
    integration: safeReadJsonl("ops/events/integration.jsonl", limit),
    ui: safeReadJsonl("ops/events/ui.jsonl", limit),
    security: safeReadJsonl("ops/events/security.jsonl", limit),
    demo: safeReadJsonl("ops/events/demo.jsonl", limit)
  };
}

function collectDomainEvents() {
  return [
    ...safeReadJson("ops/reports/demo/domain-events.json", []),
    ...safeReadJson("ops/reports/security/domain-events.json", [])
  ].sort((left, right) => String(left.ts || "").localeCompare(String(right.ts || "")));
}

function json(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function contentType(filePath) {
  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }
  if (filePath.endsWith(".js")) {
    return "application/javascript; charset=utf-8";
  }
  if (filePath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  if (filePath.endsWith(".svg")) {
    return "image/svg+xml";
  }
  return "text/html; charset=utf-8";
}

function safeReadText(relPath, fallback = "") {
  try {
    return fs.readFileSync(path.join(root, relPath), "utf8");
  } catch {
    return fallback;
  }
}

function serveFile(res, absolutePath) {
  try {
    const payload = fs.readFileSync(absolutePath);
    res.writeHead(200, {
      "Content-Type": contentType(absolutePath),
      "Cache-Control": "no-store"
    });
    res.end(payload);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/" || url.pathname === "/index.html") {
    if (serveFile(res, path.join(webRoot, "index.html"))) {
      return;
    }
  }

  if (url.pathname.startsWith("/assets/")) {
    const relPath = url.pathname.replace(/^\/assets\//, "");
    if (serveFile(res, path.join(webRoot, relPath))) {
      return;
    }
  }

  if (url.pathname === "/health") {
    json(res, 200, {
      ok: true,
      service: "waal-api",
      ts: new Date().toISOString()
    });
    return;
  }

  if (url.pathname === "/contracts") {
    json(res, 200, contracts);
    return;
  }

  if (url.pathname === "/status") {
    json(res, 200, collectStatuses());
    return;
  }

  if (url.pathname.startsWith("/status/")) {
    const lane = url.pathname.split("/").pop();
    json(res, 200, safeReadJson(`ops/status/${lane}.json`, {}));
    return;
  }

  if (url.pathname === "/events") {
    const lane = url.searchParams.get("lane");
    const limit = Number(url.searchParams.get("limit") || 50);
    json(res, 200, collectEvents(lane, limit));
    return;
  }

  if (url.pathname === "/watchboard-state") {
    json(res, 200, safeReadJson("ops/watchboard-state.json", {}));
    return;
  }

  if (url.pathname === "/kanban") {
    json(res, 200, safeReadJson("ops/kanban.json", {}));
    return;
  }

  if (url.pathname === "/notifications") {
    const watchboard = safeReadJson("ops/watchboard-state.json", {});
    json(res, 200, watchboard.notifications || []);
    return;
  }

  if (url.pathname === "/research") {
    const watchboard = safeReadJson("ops/watchboard-state.json", {});
    json(res, 200, watchboard.research || []);
    return;
  }

  if (url.pathname === "/security/metrics") {
    json(res, 200, safeReadJson("ops/reports/security/metrics.json", {}));
    return;
  }

  if (url.pathname === "/demo/latest-run") {
    json(res, 200, safeReadJson("ops/reports/demo/latest-run.json", {}));
    return;
  }

  if (url.pathname === "/demo/domain-events") {
    json(res, 200, collectDomainEvents());
    return;
  }

  if (url.pathname === "/demo/summary") {
    res.writeHead(200, {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(safeReadText("ops/reports/demo/summary.md", "# Demo summary unavailable\n"));
    return;
  }

  json(res, 404, {
    ok: false,
    error: "not_found"
  });
});

server.listen(port, host, () => {
  console.log(`WAAL API listening on http://${host}:${port}`);
});
