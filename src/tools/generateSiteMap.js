// --- START OF FILE src/tools/generateSitemap.js (Corrected Path Calculation) ---

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- FIX: Go up TWO levels from src/tools to reach project root ---
const projectRoot = path.resolve(__dirname, "../../"); // Use path.resolve for reliability
// --- END FIX ---

const srcDir = path.join(projectRoot, "src");

console.log(`[*] Script directory (__dirname): ${__dirname}`); // Log for debugging
console.log(`[*] Calculated project root: ${projectRoot}`); // Log for debugging
console.log(`[*] Calculated src directory: ${srcDir}`); // Log for debugging

const analyzeDirectory = (
  dir,
  depth = 0,
  ignoredPatterns = [/node_modules/, /^\./, /^dist$/, /__pycache__/],
) => {
  // Added default ignores
  try {
    const items = fs.readdirSync(dir);
    let output = "";

    items.forEach((item) => {
      // Check against ignored patterns
      if (ignoredPatterns.some((pattern) => pattern.test(item))) {
        // console.log(`  Skipping ignored item: ${item}`); // Optional log
        return;
      }

      const fullPath = path.join(dir, item);
      let stats;
      try {
        stats = fs.statSync(fullPath);
      } catch (statError) {
        // Handle potential errors like broken symlinks
        console.warn(
          `  Warn: Could not get stats for ${fullPath}, skipping. (${statError.message})`,
        );
        return;
      }

      output += `${"  ".repeat(depth)}├── ${item}${stats.isDirectory() ? "/" : ""}\n`; // Use tree-like symbols

      if (stats.isDirectory()) {
        output += analyzeDirectory(fullPath, depth + 1, ignoredPatterns); // Pass ignores down
      } else if (path.extname(item) === ".js" || path.extname(item) === ".ts") {
        // Also check .ts files
        try {
          const content = fs.readFileSync(fullPath, "utf8");
          // More robust regex, handles export default class, export async function etc.
          const classes = [
            ...content.matchAll(/export\s+(?:default\s+)?class\s+(\w+)/g),
          ].map((m) => m[1]);
          const functions = [
            ...content.matchAll(
              /export\s+(?:async\s+)?(?:function|const)\s+(\w+)/g,
            ),
          ].map((m) => m[2]);

          if (classes.length)
            output += `${"  ".repeat(depth + 1)}│   └── ✨ Classes: ${classes.join(", ")}\n`;
          if (functions.length)
            output += `${"  ".repeat(depth + 1)}│   └── 🔧 Functions: ${functions.join(", ")}\n`;
        } catch (readError) {
          console.warn(
            `  Warn: Could not read file ${fullPath}, skipping analysis. (${readError.message})`,
          );
        }
      }
    });

    return output;
  } catch (error) {
    // Log specific error for the directory being processed
    console.error(
      `❌ Error processing directory ${path.relative(projectRoot, dir) || "."}:`,
      error.message,
    );
    return ""; // Return empty string for this branch on error
  }
};

// Verify src directory exists first
if (!fs.existsSync(srcDir)) {
  // Use console.error instead of throwing to potentially allow script to continue/exit gracefully
  console.error(
    `❌ Error: Source directory not found at resolved path: ${srcDir}`,
  );
  process.exit(1); // Exit with an error code
} else {
  console.log(`✅ Found source directory: ${srcDir}`);
}

console.log("\n🌲 Generating Sitemap...\n");

// Analyze the src directory
const sitemapContent = analyzeDirectory(srcDir); // Start analysis from srcDir

const sitemap = `# Project Sitemap (${new Date().toLocaleDateString()})

\`\`\`
${srcDir.replace(projectRoot, "")} # Start from src relative to root
${sitemapContent}
\`\`\`
`;

// Write the sitemap file
try {
  fs.writeFileSync(path.join(projectRoot, "SITEMAP.md"), sitemap);
  console.log(
    `\n✅ Sitemap generated successfully at: ${path.join(projectRoot, "SITEMAP.md")}`,
  );
} catch (writeError) {
  console.error(`❌ Error writing SITEMAP.md:`, writeError.message);
  process.exit(1);
}
