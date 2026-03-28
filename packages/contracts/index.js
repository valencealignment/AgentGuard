import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractsPath = path.join(__dirname, "contracts.json");

export function loadContracts() {
  return JSON.parse(fs.readFileSync(contractsPath, "utf8"));
}

export const contracts = loadContracts();
