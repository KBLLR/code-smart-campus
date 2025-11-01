import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

console.log("🚀 Starting Detailed Sitemap Generation...");

// --- Configuration ---
const ROOT_DIR_NAME = "smart-campus-live-integration"; // Adjust if your root folder name is different
const SRC_FOLDER = "src";
const OUTPUT_FILE = "SITEMAP_DETAILED.md";
const IGNORED_DIRS = /node_modules|dist|\.git|\.vscode|__pycache__|\.DS_Store/;
const IGNORED_FILES = /\.log$|\.md$|^\.|\.lock$|\.ico$|\.webmanifest$/; // Ignore logs, markdown, dotfiles etc.
const INCLUDE_EXTENSIONS = /\.(js|ts|jsx|tsx|json|css|html|svg|glsl|hdr)$/; // Files to include in the listing
const PARSE_EXTENSIONS = /\.(js|ts|jsx|tsx)$/; // Files to parse for exports/imports

// --- Path Calculation ---
const __filename = fileURLToPath(import.meta.url);
// Find project root dynamically by going up until ROOT_DIR_NAME is found
let currentDir = path.dirname(__filename);
let projectRoot = currentDir;
while (
  path.basename(projectRoot) !== ROOT_DIR_NAME &&
  projectRoot !== path.parse(projectRoot).root
) {
  projectRoot = path.dirname(projectRoot);
}
if (path.basename(projectRoot) !== ROOT_DIR_NAME) {
  console.error(
    `❌ Error: Could not determine project root '${ROOT_DIR_NAME}'. Calculated root: ${projectRoot}`,
  );
  process.exit(1);
}
const srcDir = path.join(projectRoot, SRC_FOLDER);

console.log(`[*] Project Root: ${projectRoot}`);
console.log(`[*] Source Directory: ${srcDir}`);

// --- File Parsing Functions ---

/** Extracts exported class and function names from file content */
function extractExports(content) {
  const classes = [
    ...content.matchAll(/export\s+(?:default\s+)?class\s+([\w$]+)/g),
  ].map((m) => m[1]);
  // Match 'export function name', 'export async function name', 'export const name = function', 'export const name = async function', 'export const name = () =>'
  const functions = [
    ...content.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+([\w$]+)/g),
  ].map((m) => m[2]);
  // Maybe add exported variables? export let ... export const ... (excluding functions/classes)
  // const variables = [...content.matchAll(/export\s+(?:let|const)\s+([\w$]+)(?!\s*=\s*(?:=>|function|\(|class))/g)].map(m => m[1]);
  return { classes, functions };
}

/** Extracts imported module paths from file content */
function extractImports(content) {
  // Match 'from "./module"', 'from "@/alias/module"', 'from "package"'
  const fromImports = [
    ...content.matchAll(/(?:import|export)\s+.*\s+from\s+['"]([^'"]+)['"]/g),
  ].map((m) => m[1]);
  // Match side-effect imports: import "./styles.css";
  const sideEffectImports = [
    ...content.matchAll(/import\s+['"]([^'"]+)['"]/g),
  ].map((m) => m[1]);
  // Combine and deduplicate
  return [...new Set([...fromImports, ...sideEffectImports])];
}

// --- Directory Traversal and Analysis ---

const fileData = {}; // Store data { path: { exports: {}, imports: [] } }

/** Recursively analyzes directories */
function analyzeDirectory(dir) {
  console.log(` -> Analyzing: ${path.relative(projectRoot, dir)}`);
  let items;
  try {
    items = fs.readdirSync(dir);
  } catch (err) {
    console.warn(
      `   ⚠️ Could not read directory: ${path.relative(projectRoot, dir)} - ${err.message}`,
    );
    return;
  }

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    let stats;
    try {
      stats = fs.statSync(fullPath);
    } catch (err) {
      console.warn(
        `   ⚠️ Could not get stats for: ${path.relative(projectRoot, fullPath)} - ${err.message}`,
      );
      return; // Skip item if stats fail (e.g., broken symlink)
    }

    const relativePath = path.relative(projectRoot, fullPath);

    if (stats.isDirectory()) {
      if (!IGNORED_DIRS.test(item)) {
        analyzeDirectory(fullPath); // Recurse
      }
    } else if (INCLUDE_EXTENSIONS.test(item) && !IGNORED_FILES.test(item)) {
      // Store basic info for all included files
      fileData[relativePath] = {
        exports: { classes: [], functions: [] },
        imports: [],
      };

      // Parse specific file types for more details
      if (PARSE_EXTENSIONS.test(item)) {
        try {
          const content = fs.readFileSync(fullPath, "utf8");
          fileData[relativePath].exports = extractExports(content);
          fileData[relativePath].imports = extractImports(content);
        } catch (err) {
          console.warn(
            `   ⚠️ Could not read/parse file: ${relativePath} - ${err.message}`,
          );
          // Keep basic file entry, but parsing failed
        }
      }
    }
  });
}

// --- Markdown Generation ---

/** Formats the analyzed data into Markdown */
function formatMarkdown() {
  let md = `# Project Structure & Connections\n\n`;
  md += `_Generated: ${new Date().toISOString()}_\n\n`;

  const sortedPaths = Object.keys(fileData).sort();

  sortedPaths.forEach((filePath) => {
    const data = fileData[filePath];
    const depth = filePath.split(path.sep).length - 1; // Calculate depth based on path separators
    const indent = "  ".repeat(depth > 0 ? depth - 1 : 0); // Indent based on depth (start indenting from src/ level)
    const fileName = path.basename(filePath);

    md += `${indent}*   **${fileName}** (\`${filePath}\`)\n`;

    const { classes, functions } = data.exports;
    if (classes.length > 0) {
      md += `${indent}    *   ✨ Exports Classes: \`${classes.join("`, `")}\`\n`;
    }
    if (functions.length > 0) {
      md += `${indent}    *   🔧 Exports Functions: \`${functions.join("`, `")}\`\n`;
    }

    if (data.imports.length > 0) {
      md += `${indent}    *   🔗 Imports:\n`;
      data.imports.sort().forEach((imp) => {
        // Simple check for external vs internal
        const marker =
          imp.startsWith(".") || imp.startsWith("@/")
            ? "(internal)"
            : "(external)";
        md += `${indent}        *   \`${imp}\` ${marker}\n`;
      });
    }
    md += `\n`; // Add space between file entries
  });

  return md;
}

// --- Main Execution ---

if (!fs.existsSync(srcDir)) {
  console.error(
    `❌ Error: Source directory not found at resolved path: ${srcDir}`,
  );
  process.exit(1);
} else {
  console.log(`✅ Found source directory: ${srcDir}`);
}

console.log("\n🌲 Analyzing project structure...");
analyzeDirectory(projectRoot); // Start analysis from project root to include config files etc.
// If you only want 'src': analyzeDirectory(srcDir);

console.log("\n📝 Formatting Markdown...");
const markdownContent = formatMarkdown();

const outputPath = path.join(projectRoot, OUTPUT_FILE);
try {
  fs.writeFileSync(outputPath, markdownContent);
  console.log(`\n✅ Detailed Sitemap generated successfully at: ${outputPath}`);
} catch (writeError) {
  console.error(`❌ Error writing ${OUTPUT_FILE}:`, writeError.message);
  process.exit(1);
}

console.log("\n🏁 Generation finished.");
