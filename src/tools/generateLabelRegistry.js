// src/tools/generateLabelRegistry.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url"; // To get __dirname in ES modules
import dotenv from "dotenv";

// --- Configuration ---
const OUTPUT_FILENAME = "labelRegistry.js"; // Name of the generated registry file
const ROOM_REGISTRY_FILENAME = "roomRegistry.js"; // Name of the room registry to import
const DOTENV_FILENAME = ".env"; // Name of the environment file

// --- Path Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths relative to the project root (assuming tools/ is in src/)
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const outputDir = path.resolve(PROJECT_ROOT, "src", "data");
const outputPath = path.resolve(outputDir, OUTPUT_FILENAME);
const roomRegistryPath = path.resolve(outputDir, ROOM_REGISTRY_FILENAME);
const dotenvPath = path.resolve(PROJECT_ROOT, DOTENV_FILENAME);

// --- Load Environment Variables ---
console.log(`🔄 Loading environment variables from: ${dotenvPath}`);
const configResult = dotenv.config({ path: dotenvPath });
if (configResult.error) {
  console.warn(
    `⚠️ Warning: Could not load ${DOTENV_FILENAME} file: ${configResult.error.message}. Trying system environment variables.`,
  );
}
// Use process.env directly as dotenv modifies it
const REST_URL = process.env.VITE_CLOUD_REST || process.env.VITE_HA_URL;
const HA_TOKEN = process.env.VITE_CLOUD_TOKEN || process.env.VITE_HA_TOKEN;

// Validate essential environment variables
if (!REST_URL)
  console.error(
    "❌ Error: VITE_CLOUD_REST or VITE_HA_URL environment variable is required but not set.",
  );
if (!HA_TOKEN)
  console.error(
    "❌ Error: VITE_CLOUD_TOKEN or VITE_HA_TOKEN environment variable is required but not set.",
  );

// --- Import Room Registry ---
let roomRegistry = {};
try {
  if (!fs.existsSync(roomRegistryPath)) {
    throw new Error(
      `Room registry file not found at ${roomRegistryPath}. Please generate it first.`,
    );
  }
  // Dynamically import the generated roomRegistry
  const roomRegistryModule = await import(
    `file://${roomRegistryPath}?update=${Date.now()}`
  ); // Cache-busting query param
  if (
    !roomRegistryModule ||
    typeof roomRegistryModule.roomRegistry !== "object"
  ) {
    throw new Error(
      `Invalid export format in ${ROOM_REGISTRY_FILENAME}. Expected 'export const roomRegistry = { ... };'`,
    );
  }
  roomRegistry = roomRegistryModule.roomRegistry;
  console.log(
    `  [*] Successfully imported room registry with ${Object.keys(roomRegistry).length} entries.`,
  );
} catch (error) {
  console.error(`❌ Error importing room registry: ${error.message}`);
  // Optionally exit if room registry is critical
  // process.exit(1);
}

// --- Helper Functions ---
const skippedEntities = new Set(); // Use a Set to avoid duplicate reporting

/**
 * Attempts to match an entity ID to a room ID defined in the roomRegistry.
 * Uses simple string inclusion logic. Needs refinement for complex cases.
 * @param {string} entityId - The Home Assistant entity ID.
 * @returns {string|null} The matched room ID (lowercase) or null if no match.
 */
const fuzzyRoomMatch = (entityId) => {
  if (!entityId) return null;
  const id = entityId.toLowerCase();
  // Add more specific rules first
  if (id.includes("kitchen")) return "kitchen";
  if (id.includes("library")) return "library";
  if (id.includes("makerspace") || id.includes("maker")) return "a.5";
  if (id.includes("dark") || id.includes("matter")) return "b.14";
  if (id.includes("tet")) return "a.11-a.12";
  if (id.includes("jungle")) return "a.2";
  if (id.includes("hive")) return "a.3";
  if (id.includes("a6") || id.includes("muted")) return "a.6";
  if (id.includes("front") || id.includes("desk")) return "desk";
  if (id.includes("b7")) return "b.7";
  if (id.includes("b5")) return "b.5";
  if (id.includes("b4")) return "b.4";
  if (id.includes("b6")) return "b.6";
  if (id.includes("sun")) return "global"; // Special case - does 'global' exist in your roomRegistry?

  // Fallback: Try matching based on room registry keys directly
  const matchedRoom = Object.keys(roomRegistry).find((roomId) =>
    id.includes(roomId),
  );
  if (matchedRoom) return matchedRoom;

  return null; // No match found
};

/**
 * Classifies a label type based on keywords in the entity ID. Used for icon selection.
 * @param {string} entityId - The Home Assistant entity ID.
 * @returns {string} A string representing the label type/icon name.
 */
const classifyLabel = (entityId) => {
  if (!entityId) return "unknown";
  const id = entityId.toLowerCase();
  if (id.includes("temp") || id.includes("temperature"))
    return "temperature-plus";
  if (id.includes("humidity")) return "humidity"; // Added humidity
  if (
    id.includes("voc") ||
    id.includes("air") ||
    id.includes("pm25") ||
    id.includes("co2")
  )
    return "air-quality-good"; // Broader air quality
  if (id.includes("light") && !id.startsWith("light.")) return "lightbulb"; // Sensor reporting brightness
  if (id.includes("motion") || id.includes("presence")) return "motion-sensor"; // Added presence
  if (id.includes("occupancy")) return "occupancy";
  if (id.includes("door") || id.includes("window") || id.includes("garage"))
    return "door-window";
  if (id.includes("sun.sun")) return "sun";
  if (id.includes("camera")) return "camera";
  if (id.includes("calendar")) return "calendar";
  if (
    id.includes("power") ||
    id.includes("energy") ||
    id.includes("current") ||
    id.includes("voltage")
  )
    return "power-plug"; // Power related
  if (id.startsWith("person.")) return "person";
  if (id.startsWith("media_player.")) return "media-player";
  if (id.startsWith("light.")) return "lightbulb";
  if (id.startsWith("switch.")) return "switch";
  if (id.startsWith("climate.")) return "climate";
  // Add more specific classifications
  return "unknown"; // Default classification
};

/**
 * Classifies the primary functional type of an entity. Used for grouping/sorting.
 * @param {string} entityId - The Home Assistant entity ID.
 * @returns {string} A string representing the entity's function.
 */
const classifyEntityType = (entityId) => {
  if (!entityId) return "generic";
  const id = entityId.toLowerCase();
  // Prioritize specific types
  if (id.startsWith("calendar.")) return "calendar";
  if (id.includes("temp") || id.includes("temperature")) return "temperature";
  if (id.includes("humidity")) return "humidity";
  if (
    id.includes("occupancy") ||
    id.includes("presence") ||
    id.includes("motion")
  )
    return "occupancy";
  if (
    id.includes("air") ||
    id.includes("voc") ||
    id.includes("pm25") ||
    id.includes("co2")
  )
    return "air_quality";
  if (id.startsWith("person.")) return "person";
  if (id.startsWith("light.")) return "light";
  if (id.startsWith("switch.")) return "switch";
  if (id.startsWith("media_player.")) return "media";
  if (id.startsWith("climate.")) return "climate";
  if (id.includes("power") || id.includes("energy")) return "power";
  if (id.includes("sun.sun")) return "global";
  // Less specific fallbacks
  if (id.startsWith("sensor.")) return "sensor";
  if (id.startsWith("binary_sensor.")) return "binary_sensor";
  return "generic"; // Default type
};

/**
 * Assigns a numerical priority based on entity type. Lower numbers are higher priority.
 * Used for layout or filtering.
 * @param {string} type - The classified entity type from classifyEntityType.
 * @returns {number} The priority value.
 */
const assignPriority = (type) => {
  switch (type) {
    case "calendar":
      return 1;
    case "temperature":
      return 2;
    case "humidity":
      return 3;
    case "occupancy":
      return 4;
    case "air_quality":
      return 5;
    case "light":
      return 6;
    case "switch":
      return 7;
    case "climate":
      return 8;
    case "media":
      return 9;
    case "power":
      return 10;
    case "person":
      return 11;
    case "global":
      return 50; // Low priority for global things like sun
    case "sensor":
      return 80;
    case "binary_sensor":
      return 81;
    default:
      return 99; // Lowest priority for generic/unknown
  }
};

/**
 * Fetches states from Home Assistant and generates the labelRegistry.js file.
 * @returns {Promise<number>} The number of entries successfully added to the registry.
 */
export async function generate() {
  console.log(`🔄 Starting label registry generation...`);
  if (!REST_URL || !HA_TOKEN || Object.keys(roomRegistry).length === 0) {
    console.error(
      "❌ Pre-requisites missing (HA URL/Token or Room Registry). Cannot generate labels.",
    );
    return 0;
  }

  // Construct the API URL carefully
  let baseApiUrl;
  try {
    baseApiUrl = new URL(REST_URL); // Validate URL
    baseApiUrl.pathname = "/api"; // Set base path to /api
  } catch (error) {
    console.error(
      `❌ Invalid Home Assistant URL provided (${REST_URL}): ${error.message}`,
    );
    return 0;
  }
  const statesUrl = new URL("states", baseApiUrl).toString();

  console.log(`  [*] Fetching states from: ${statesUrl}`);
  let entities = [];
  const fetchOptions = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${HA_TOKEN}`,
      "Content-Type": "application/json",
    },
    // Consider adding a timeout using AbortController
  };

  try {
    const res = await fetch(statesUrl, fetchOptions);
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(
        `HTTP error! Status: ${res.status} ${res.statusText}. Response: ${errorBody.substring(0, 200)}`,
      );
    }
    entities = await res.json();
    if (!Array.isArray(entities)) {
      throw new Error("Received non-array response from HA states endpoint.");
    }
    console.log(
      `  [*] Successfully fetched ${entities.length} states from Home Assistant.`,
    );
  } catch (error) {
    console.error(
      "❌ Failed to fetch or parse states from Home Assistant:",
      error.message,
    );
    return 0; // Stop generation if fetch fails
  }

  const registry = {};
  skippedEntities.clear(); // Reset skipped set for this run

  // --- Entity Filtering and Processing ---
  const ALLOWED_PREFIXES = [
    "sensor.",
    "binary_sensor.",
    "person.",
    "light.",
    "switch.",
    "calendar.",
    "media_player.",
    "climate.",
  ];

  for (const entity of entities) {
    // Basic validation of the entity object
    if (
      !entity ||
      typeof entity !== "object" ||
      !entity.entity_id ||
      typeof entity.entity_id !== "string"
    ) {
      console.warn(
        `  [!] Skipping invalid entity object received from HA:`,
        JSON.stringify(entity).substring(0, 100),
      );
      continue;
    }

    const id = entity.entity_id;

    // Check if entity starts with an allowed prefix
    const isValidPrefix = ALLOWED_PREFIXES.some((prefix) =>
      id.startsWith(prefix),
    );
    if (!isValidPrefix) {
      // console.log(`  [-] Skipping entity (prefix not allowed): ${id}`); // Optional logging
      continue;
    }

    // Attempt to match entity to a room
    const roomId = fuzzyRoomMatch(id);
    const roomData = roomRegistry[roomId]; // roomRegistry keys are already lowercase

    // Skip if no room match OR if matched room doesn't have valid center coordinates
    if (
      !roomId ||
      !roomData ||
      !roomData.center ||
      !Array.isArray(roomData.center) ||
      roomData.center.length !== 3
    ) {
      skippedEntities.add(id); // Add to set of skipped entities
      continue; // Skip this entity
    }

    // Classify and prioritize
    const type = classifyEntityType(id);
    const priority = assignPriority(type);
    const icon = classifyLabel(id);

    // Determine a sensible label name
    const friendlyName = entity.attributes?.friendly_name?.trim();
    const defaultName = id.split(".").pop().replace(/_/g, " "); // Generate default from ID
    const label = friendlyName || defaultName;

    // Add entry to the registry
    registry[id] = {
      // position: [...roomData.center], // Position comes from roomRegistry, LabelManager uses 'room' key
      label: label,
      auto: true, // Flag indicating auto-generation
      icon: icon,
      room: roomId, // Link to the room ID in roomRegistry
      type: type,
      priority: priority,
    };
  } // End of entity loop

  if (Object.keys(registry).length === 0) {
    console.error(
      "❌ No valid entities could be processed to generate the label registry.",
    );
    return 0;
  }

  // --- File Output ---
  const outputContent =
    `// ${path.basename(outputPath)}\n` +
    `// Auto-generated by generateLabelRegistry.js on ${new Date().toISOString()}\n` +
    `// Contains configuration for labels based on Home Assistant entities.\n\n` +
    `export const labelRegistry = ${JSON.stringify(registry, null, 2)};\n`; // Pretty print

  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`  [*] Created output directory: ${outputDir}`);
    }
    fs.writeFileSync(outputPath, outputContent);
    console.log(
      `✅ Successfully generated ${path.basename(outputPath)} with ${Object.keys(registry).length} entries.`,
    );
  } catch (error) {
    console.error(`❌ Error writing ${OUTPUT_FILENAME}:`, error.message);
    return 0; // Indicate failure
  }

  // Report skipped entities
  if (skippedEntities.size > 0) {
    console.warn(
      `⚠️ Skipped ${skippedEntities.size} entities (could not match to a valid room in roomRegistry):`,
    );
    // Log only a few examples to avoid flooding console
    let count = 0;
    for (const skippedId of skippedEntities) {
      if (count < 10) console.warn(`  - ${skippedId}`);
      else if (count === 10)
        console.warn(`  - ... and ${skippedEntities.size - 10} more.`);
      count++;
    }
  }

  return Object.keys(registry).length; // Return number of successful entries
}

// --- CLI Execution ---
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("==========================================");
  console.log("  Running Label Registry Generation Tool  ");
  console.log("==========================================");
  const startTime = Date.now();
  generate()
    .then((count) => {
      const duration = (Date.now() - startTime) / 1000;
      if (count > 0) {
        console.log(
          `\n🏁 Generation finished in ${duration.toFixed(2)}s. ${count} labels added.`,
        );
      } else {
        console.log(
          `\n🏁 Generation failed or produced no labels after ${duration.toFixed(2)}s.`,
        );
        process.exitCode = 1; // Set failure exit code
      }
      console.log("==========================================");
    })
    .catch((err) => {
      const duration = (Date.now() - startTime) / 1000;
      console.error("\n❌ Script execution failed:", err);
      console.log(`🏁 Process failed after ${duration.toFixed(2)}s.`);
      console.log("==========================================");
      process.exitCode = 1;
    });
}
