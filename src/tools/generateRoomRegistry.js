// src/tools/generateRoomRegistry.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url"; // To get __dirname in ES modules
import { parse } from "node-html-parser"; // SVG parsing library

// --- Configuration ---
const SVG_FILENAME = "floorplan.svg"; // Name of the SVG file in the public directory
const OUTPUT_FILENAME = "roomRegistry.js"; // Name of the generated registry file
const TARGET_SVG_GROUP_ID = "rooms"; // The ID of the <g> element containing room paths in the SVG
const SVG_SCALE = 0.1; // Scale factor applied during SVG processing/import elsewhere
const ROOM_Y_POSITION = 20; // Desired Y position for the room center in 3D space

// --- Path Setup ---
// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths relative to the project root (assuming tools/ is in src/ which is sibling to public/ and contains data/)
const PROJECT_ROOT = path.resolve(__dirname, "../.."); // Move up two levels from src/tools/
const svgPath = path.resolve(PROJECT_ROOT, "public", SVG_FILENAME);
const outputDir = path.resolve(PROJECT_ROOT, "src", "data");
const outputPath = path.resolve(outputDir, OUTPUT_FILENAME);

/**
 * Extracts center coordinates from an SVG path 'd' attribute.
 * Calculates the bounding box of the path points and finds its center.
 * Applies scaling and sets a fixed Y position for 3D space.
 *
 * @param {string} dAttr - The 'd' attribute string from an SVG path.
 * @param {number} svgScale - The scaling factor to apply to coordinates.
 * @param {number} yPosition - The fixed Y coordinate for the 3D center.
 * @returns {Array<number>|null} An array [x, y, z] representing the center, or null if calculation fails.
 */
function extractCenter(dAttr, svgScale = 0.1, yPosition = 20) {
  if (!dAttr || typeof dAttr !== "string") {
    console.warn("Invalid 'd' attribute provided for center extraction.");
    return null;
  }
  // Regex to find numbers (including scientific notation) in the path data
  const nums = dAttr
    .match(/[-+]?\.?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/g)
    ?.map(Number);

  if (!nums || nums.length < 2 || nums.some(isNaN)) {
    // Check for NaN as well
    console.warn(
      `Could not extract valid numbers from path d attribute: "${dAttr.substring(0, 50)}..."`,
    );
    return null;
  }

  // Calculate bounding box from extracted points (assumes points are sequential x,y)
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let i = 0; i < nums.length; i += 2) {
    if (i + 1 < nums.length) {
      const x = nums[i];
      const y = nums[i + 1];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  // Check if bounding box calculation was successful
  if (
    !isFinite(minX) ||
    !isFinite(minY) ||
    !isFinite(maxX) ||
    !isFinite(maxY)
  ) {
    console.warn(
      `Could not determine finite bounding box from path d attribute: "${dAttr.substring(0, 50)}..."`,
    );
    return null;
  }

  // Calculate center in SVG coordinates
  const svgCx = (minX + maxX) / 2;
  const svgCy = (minY + maxY) / 2;

  // Apply scale and map to 3D coordinates (SVG Y maps to 3D Z)
  const worldCx = svgCx * svgScale;
  const worldCy = yPosition; // Fixed Y position
  const worldCz = svgCy * svgScale; // Map SVG Y to World Z

  // Return formatted coordinates, ensuring they are numbers
  return [
    parseFloat(worldCx.toFixed(2)),
    worldCy,
    parseFloat(worldCz.toFixed(2)),
  ];
}

/**
 * Generates the roomRegistry.js file by parsing an SVG file.
 * Reads room path data, calculates center points, and writes a JavaScript module.
 * @returns {object|null} The generated registry object or null on failure.
 */
export function generate() {
  console.log(`🔄 Starting room registry generation...`);
  console.log(`  [*] Reading SVG from: ${svgPath}`);
  let svgContent;
  try {
    if (!fs.existsSync(svgPath)) {
      throw new Error(`SVG file not found at ${svgPath}`);
    }
    svgContent = fs.readFileSync(svgPath, "utf-8");
  } catch (error) {
    console.error(`❌ Error reading SVG file:`, error.message);
    return null; // Stop if SVG cannot be read
  }

  let root;
  try {
    root = parse(svgContent);
  } catch (error) {
    console.error(`❌ Error parsing SVG content:`, error.message);
    return null;
  }

  // Select paths within the specified group ID
  const selector = `g#${TARGET_SVG_GROUP_ID} path`;
  const paths = root.querySelectorAll(selector);

  if (paths.length === 0) {
    console.warn(
      `⚠️ No paths found using selector '${selector}'. Please ensure the group ID and path structure in '${SVG_FILENAME}' are correct.`,
    );
    // Optional: Add fallback selector if needed
    // console.warn("Trying fallback selector 'path'...");
    // paths = root.querySelectorAll("path");
    if (paths.length === 0) return null; // Exit if still no paths
  }

  console.log(
    `  [*] Found ${paths.length} path elements within group '#${TARGET_SVG_GROUP_ID}' to process.`,
  );
  const registry = {};
  let processedCount = 0;
  let skippedCount = 0;

  paths.forEach((pathNode, index) => {
    const id = pathNode.getAttribute("id");
    // Prefer inkscape:label, then name, fallback to id
    const name =
      pathNode.getAttribute("inkscape:label") || pathNode.getAttribute("name");
    const d = pathNode.getAttribute("d");

    if (id && d) {
      const center = extractCenter(d, SVG_SCALE, ROOM_Y_POSITION);
      if (center) {
        // Use lowercase ID as key for consistency
        const key = id.toLowerCase();
        const entry = {
          name: name || id, // Use ID as name if specific name is missing
          center,
        };
        registry[key] = entry;

        const aliasCandidates = [
          key.split(/[-_\s]+/).pop(),
          name ? name.toLowerCase() : null,
        ].filter(Boolean);

        aliasCandidates.forEach((alias) => {
          if (!alias || alias === key) return;
          const normalizedAlias = alias.trim();
          if (!normalizedAlias || registry[normalizedAlias]) return;
          registry[normalizedAlias] = entry;
        });
        processedCount++;
      } else {
        console.warn(
          `  [!] Skipping path ID '${id}': Could not calculate valid center.`,
        );
        skippedCount++;
      }
    } else {
      // Log paths skipped due to missing critical attributes
      console.warn(
        `  [!] Skipping path #${index + 1}: Missing required attribute (id='${id || "undefined"}', d='${d ? "present" : "missing"}').`,
      );
      skippedCount++;
    }
  });

  if (processedCount === 0) {
    console.error("❌ No valid room data could be processed from the SVG.");
    return null;
  }

  // Prepare output content
  const outputContent =
    `// ${path.basename(outputPath)}\n` +
    `// Auto-generated from ${SVG_FILENAME} on ${new Date().toISOString()}\n` +
    `// Contains center coordinates for rooms defined in the SVG.\n\n` +
    `export const roomRegistry = ${JSON.stringify(registry, null, 2)};\n`; // Pretty print JSON

  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`  [*] Created output directory: ${outputDir}`);
    }
    // Write the file
    fs.writeFileSync(outputPath, outputContent);
    console.log(
      `✅ Successfully generated ${path.basename(outputPath)} with ${processedCount} entries.`,
    );
    if (skippedCount > 0) {
      console.log(
        `  [*] Skipped ${skippedCount} path elements due to missing data or errors.`,
      );
    }
  } catch (error) {
    console.error(
      `❌ Error writing roomRegistry.js to ${outputPath}:`,
      error.message,
    );
    return null; // Indicate failure
  }

  return registry; // Return the generated registry object
}

// --- CLI Execution ---
// Check if the script is being run directly via Node.js
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("=========================================");
  console.log("  Running Room Registry Generation Tool  ");
  console.log("=========================================");
  const startTime = Date.now();
  const generatedRegistry = generate();
  const duration = (Date.now() - startTime) / 1000;

  if (generatedRegistry) {
    console.log(
      `\n🏁 Generation finished in ${duration.toFixed(2)}s. ${Object.keys(generatedRegistry).length} rooms added.`,
    );
  } else {
    console.log(
      `\n🏁 Generation failed or produced no output after ${duration.toFixed(2)}s.`,
    );
    process.exitCode = 1; // Set exit code to indicate failure
  }
  console.log("=========================================");
}
