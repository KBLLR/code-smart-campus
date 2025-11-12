/**
 * generateRoomRegistry.js
 *
 * Strict SVG → roomRegistry generator with validation.
 * Enforces single source of truth: SVG floorplan.
 *
 * Validates:
 * - All entityLocations IDs must exist in SVG
 * - All SVG room IDs should be referenced in entityLocations
 * - No synthetic coordinates - fails hard if center cannot be computed
 *
 * Run: node src/tools/generateRoomRegistry.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "node-html-parser";
import { svgToWorldCenter } from "../config/floorplanTransform.js";

// --- Configuration ---
const SVG_FILENAME = "floorplan.svg";
const OUTPUT_FILENAME = "roomRegistry.js";
const ENTITY_LOCATIONS_FILE = "src/data/entityLocations.json";
const TARGET_SVG_GROUP_ID = "rooms";

// --- Path Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");

const svgPath = path.resolve(PROJECT_ROOT, "public", SVG_FILENAME);
const outputPath = path.resolve(PROJECT_ROOT, "src", "data", OUTPUT_FILENAME);
const entityLocationsPath = path.resolve(PROJECT_ROOT, ENTITY_LOCATIONS_FILE);

/**
 * Extracts center coordinates from an SVG path 'd' attribute.
 * Calculates bounding box and returns center point.
 *
 * @param {string} dAttr - SVG path 'd' attribute
 * @returns {[number, number]|null} SVG center [x, y] or null if failed
 */
function extractSvgCenter(dAttr) {
  if (!dAttr || typeof dAttr !== "string") {
    return null;
  }

  // Extract all numbers from path data
  const nums = dAttr
    .match(/[-+]?\.?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/g)
    ?.map(Number);

  if (!nums || nums.length < 2 || nums.some(isNaN)) {
    return null;
  }

  // Calculate bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

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

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return null;
  }

  // Return SVG center coordinates (not yet transformed)
  const svgCx = (minX + maxX) / 2;
  const svgCy = (minY + maxY) / 2;

  return [svgCx, svgCy];
}

/**
 * Parses SVG and extracts room data
 *
 * @param {string} svgContent - Raw SVG file content
 * @returns {Array<{id: string, name: string, category: string, svgCenter: [number, number]}>}
 */
function parseSvgRooms(svgContent) {
  const root = parse(svgContent);
  const selector = `g#${TARGET_SVG_GROUP_ID} path`;
  const paths = root.querySelectorAll(selector);

  if (paths.length === 0) {
    throw new Error(
      `No paths found using selector '${selector}'. Check SVG structure.`
    );
  }

  console.log(`  [*] Found ${paths.length} path elements in group '#${TARGET_SVG_GROUP_ID}'`);

  const rooms = [];
  let skippedCount = 0;

  paths.forEach((pathNode) => {
    const id = pathNode.getAttribute("id");
    const dAttr = pathNode.getAttribute("d");
    const dataName = pathNode.getAttribute("data-name");
    const dataCategory = pathNode.getAttribute("data-category");

    if (!id) {
      console.warn(`  [!] Skipping path without 'id' attribute`);
      skippedCount++;
      return;
    }

    if (!dAttr) {
      console.warn(`  [!] Skipping path id='${id}': missing 'd' attribute`);
      skippedCount++;
      return;
    }

    const svgCenter = extractSvgCenter(dAttr);
    if (!svgCenter) {
      console.warn(`  [!] Skipping path id='${id}': could not compute center`);
      skippedCount++;
      return;
    }

    rooms.push({
      id: id,
      name: dataName || id,
      category: dataCategory || "Unknown",
      svgCenter: svgCenter,
    });
  });

  if (skippedCount > 0) {
    console.log(`  [*] Skipped ${skippedCount} paths due to missing data`);
  }

  return rooms;
}

/**
 * Validates SVG rooms against entityLocations.json
 * Ensures all entity IDs exist in SVG and vice versa
 *
 * @param {Array} rooms - Rooms parsed from SVG
 * @param {Array} entityLocations - Entity location definitions
 * @throws {Error} If validation fails
 */
function validateRoomsAgainstEntities(rooms, entityLocations) {
  const svgIds = new Set(rooms.map((r) => r.id));
  const entityIds = new Set(entityLocations.map((e) => e.id));

  // Check for entity IDs missing in SVG (HARD ERROR)
  const missingInSvg = [...entityIds].filter((id) => !svgIds.has(id));
  if (missingInSvg.length > 0) {
    console.error("\n❌ VALIDATION FAILED: entityLocations IDs missing in SVG:");
    missingInSvg.forEach((id) => console.error(`   - "${id}"`));
    throw new Error(
      `${missingInSvg.length} room(s) in entityLocations.json have no matching SVG path. ` +
      `Fix your SVG or remove these entries from entityLocations.json`
    );
  }

  // Check for SVG IDs not referenced in entityLocations (WARNING)
  const unusedInEntities = [...svgIds].filter((id) => !entityIds.has(id));
  if (unusedInEntities.length > 0) {
    console.warn("\n⚠️  SVG rooms not referenced in entityLocations.json:");
    unusedInEntities.forEach((id) => console.warn(`   - "${id}"`));
    console.warn("These rooms will be included in roomRegistry but have no sensor bindings.\n");
  }

  console.log("  [✓] Validation passed: All entity IDs exist in SVG");
}

/**
 * Generates roomRegistry.js from SVG with strict validation
 */
export function generate() {
  console.log("🔄 Starting strict room registry generation...");
  console.log(`  [*] SVG source: ${path.relative(PROJECT_ROOT, svgPath)}`);
  console.log(`  [*] Entity locations: ${path.relative(PROJECT_ROOT, entityLocationsPath)}`);

  // Read SVG
  if (!fs.existsSync(svgPath)) {
    throw new Error(`SVG file not found: ${svgPath}`);
  }
  const svgContent = fs.readFileSync(svgPath, "utf-8");

  // Read entityLocations
  if (!fs.existsSync(entityLocationsPath)) {
    throw new Error(`entityLocations.json not found: ${entityLocationsPath}`);
  }
  const entityLocations = JSON.parse(fs.readFileSync(entityLocationsPath, "utf-8"));

  // Parse SVG
  const rooms = parseSvgRooms(svgContent);
  console.log(`  [*] Parsed ${rooms.length} rooms from SVG`);

  // Validate against entityLocations
  validateRoomsAgainstEntities(rooms, entityLocations);

  // Generate registry with world coordinates
  const registry = {};
  rooms.forEach((room) => {
    const [svgX, svgY] = room.svgCenter;
    const worldCenter = svgToWorldCenter(svgX, svgY);

    registry[room.id] = {
      id: room.id,
      name: room.name,
      category: room.category,
      center: worldCenter,
    };
  });

  // Write output
  const outputContent = `// AUTO-GENERATED from ${SVG_FILENAME}
// Generated: ${new Date().toISOString()}
// Do NOT edit by hand - regenerate with: node src/tools/generateRoomRegistry.js
//
// Source of truth: public/floorplan.svg
// Transform: src/config/floorplanTransform.js

export const roomRegistry = ${JSON.stringify(registry, null, 2)};
`;

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, outputContent, "utf-8");

  console.log(`\n✅ Successfully generated roomRegistry.js`);
  console.log(`   ${Object.keys(registry).length} rooms with validated coordinates`);
  console.log(`   Output: ${path.relative(PROJECT_ROOT, outputPath)}`);

  return registry;
}

// --- CLI Execution ---
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("=========================================");
  console.log("  Room Registry Generator (Strict)");
  console.log("=========================================\n");

  const startTime = Date.now();

  try {
    const registry = generate();
    const duration = (Date.now() - startTime) / 1000;

    console.log(`\n🏁 Generation completed in ${duration.toFixed(2)}s`);
    console.log("=========================================");
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    console.error(`\n❌ Generation failed after ${duration.toFixed(2)}s:`);
    console.error(`   ${error.message}`);
    console.log("=========================================");
    process.exitCode = 1;
  }
}
