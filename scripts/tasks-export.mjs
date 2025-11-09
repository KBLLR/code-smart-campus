#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { load } from "js-yaml";

const yamlPath = path.resolve("tasks.yaml");
const mdPath = path.resolve("tasks.md");

if (!fs.existsSync(yamlPath)) {
  console.error("tasks.yaml not found at repo root.");
  process.exit(1);
}

const data = load(fs.readFileSync(yamlPath, "utf8")) || {};

const sections = [
  ["backlog", "Backlog"],
  ["in_progress", "In Progress"],
  ["review", "Review / QA"],
  ["done", "Done"],
];

const makeTable = (items = []) => {
  const header = "| ID | Title | Priority | Owner | Notes |\n|----|-------|----------|-------|-------|";
  if (!items.length) return `${header}\n| — | — | — | — | — |`;
  const rows = items.map((item) => {
    const notes = item.description
      ? `${item.description}${
          item.research?.length ? ` (Research: ${item.research.join(", ")})` : ""
        }`
      : item.notes ?? "";
    return `| ${item.id ?? ""} | ${item.title ?? ""} | ${item.priority ?? ""} | ${item.owner ?? ""} | ${notes} |`;
  });
  return [header, ...rows].join("\n");
};

let output = "# Task Ledger\n\n";
if (data.project) {
  output += `Project ID Prefix: **${data.project.id_prefix ?? "N/A"}**  \n`;
  output += `Owner: **${data.project.owner ?? "N/A"}**  \n`;
  if (data.project.variant || data.project.intent) {
    output += `Variant: **${data.project.variant ?? "UNSPECIFIED"}**  \n`;
    output += `Intent: **${data.project.intent ?? "TBD"}**\n`;
  }
  output += "\n";
}

for (const [key, label] of sections) {
  output += `## ${label}\n`;
  output += `${makeTable(data[key] || [])}\n\n`;
}

fs.writeFileSync(mdPath, output.trim() + "\n", "utf8");
console.log(`tasks.md written (${sections.map(([k]) => (data[k] || []).length).reduce((a, b) => a + b, 0)} tasks).`);
