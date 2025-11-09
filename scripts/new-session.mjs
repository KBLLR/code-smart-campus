#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";
import { load } from "js-yaml";

const args = process.argv.slice(2);
const opts = {
  diff: false,
};
const textArgs = [];

for (const arg of args) {
  if (arg === "--diff") {
    opts.diff = true;
  } else if (arg === "--") {
    continue;
  } else {
    textArgs.push(arg);
  }
}

const summary = textArgs.join(" ").trim();
if (!summary) {
  console.error("Usage: pnpm run new:session \"short summary\" [-- --diff]");
  process.exit(1);
}

const now = new Date();
const pad = (num) => String(num).padStart(2, "0");
const timestamp = [
  now.getUTCFullYear(),
  "-",
  pad(now.getUTCMonth() + 1),
  "-",
  pad(now.getUTCDate()),
  "T",
  pad(now.getUTCHours()),
  "-",
  pad(now.getUTCMinutes()),
].join("");

const slug =
  summary
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "session";
const sessionsDir = path.resolve("sessions");
const templatePath = path.resolve("sessions", "session-template.md");
const filePath = path.join(sessionsDir, `${timestamp}-${slug}.md`);

if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

let template = "";
try {
  template = fs.readFileSync(templatePath, "utf8");
} catch (error) {
  template = `# Session: {{SESSION_NAME}}\n**Date:** {{DATE_ISO}}\n**Task IDs:** {{TASK_IDS}}\n**Models consulted:** {{MODELS}}\n**Image/Prompt IDs:** {{PROMPT_IDS}}\n\n## Objectives\n-\n\n## Execution Notes\n-\n\n## Capability Flags\n-\n\n## Lint/Test Status\n-\n\n## Next Actions\n-\n\n{{FILES_SECTION}}\n`;
}

const replacements = {
  SESSION_NAME: summary,
  DATE_ISO: now.toISOString(),
  TASK_IDS: "",
  MODELS: "",
  PROMPT_IDS: "",
  PROJECT_VARIANT: "UNSPECIFIED",
  PROJECT_INTENT: "",
};

try {
  const yaml = load(fs.readFileSync("tasks.yaml", "utf8"));
  const meta = yaml?.project ?? {};
  replacements.PROJECT_VARIANT = meta.variant ?? "UNSPECIFIED";
  replacements.PROJECT_INTENT = meta.intent ?? "";
} catch (error) {
  console.warn("[new-session] Unable to read tasks.yaml:", error.message);
}

let content = template.replace(
  /{{(SESSION_NAME|DATE_ISO|TASK_IDS|MODELS|PROMPT_IDS)}}/g,
  (_, key) => replacements[key] ?? "",
);

let filesSection = "";
if (opts.diff) {
  try {
    const diff = execSync("git diff --name-only", {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean)
      .map((line) => `- ${line}`)
      .join("\n");
    if (diff) {
      filesSection = `## Files (git diff --name-only)\n${diff}\n`;
    }
  } catch (error) {
    console.warn("[new-session] Unable to read git diff:", error.message);
  }
}

content = content.replace(/{{FILES_SECTION}}/g, filesSection);

fs.writeFileSync(filePath, content, { encoding: "utf8", flag: "wx" });
console.log(`Session created: ${path.relative(process.cwd(), filePath)}`);
