
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct paths to data files (assuming this script is in src/tools)
const srcDir = path.resolve(__dirname, '..');
const personalitiesPath = path.join(srcDir, 'data', 'personalities', 'rooms_personalities.json');
const oceanPath = path.join(srcDir, 'data', 'personalities', 'ocean-personalities.json');
const outputPath = path.join(srcDir, 'data', 'personalities', 'unified_rooms_data.js');

// Load Data
const roomsPersonalities = JSON.parse(fs.readFileSync(personalitiesPath, 'utf8'));
const oceanPersonalities = JSON.parse(fs.readFileSync(oceanPath, 'utf8'));

// Room List provided by user (updated source of truth from GLB tree)
const roomsList = [
    // --- ROW A ---
    { name: "Babylon", id: "a1", area: "Garden", use: "Meetings" },
    { name: "Jungle", id: "a2", area: "Garden", use: "Learning units" },
    { name: "HIVE Project Space", id: "a3", area: "Hive", use: "Project" },
    // a5 is now labmakerspace in GLB? Or maybe a5 is gone? User tree says 'labmakerspace'.
    // We will list 'labmakerspace' and map it to a5 personality.
    { name: "Muted", id: "a6", area: "Hive", use: "Workspaces" },
    { name: "Tet Ris", id: "a11", area: "Cosmos", use: "Learning units" }, // GLB has a11
    { name: "Houston", id: "a14", area: "Cantina", use: "Team spaces" },
    { name: "A.22", id: "a22", area: "Garden", use: "Team spaces" }, // New in tree
    { name: "A.23 (Narrative)", id: "a23", area: "Creative Core", use: "Project" },
    { name: "Pandora", id: "a24", area: "Garden", use: "Learning units" },
    { name: "A.25 (Harmony)", id: "a25", area: "Creative Core", use: "Project" },
    { name: "A.26 (Form)", id: "a26", area: "Creative Core", use: "Project" },

    // --- ROW B ---
    { name: "Aang", id: "b2", area: "Garden", use: "Meditation space" },
    { name: "Peace", id: "b3", area: "Garden", use: "Meetings" },
    { name: "B.4", id: "b4", area: "Garden", use: "Meetings" },
    { name: "B Present", id: "b5", area: "Cosmos", use: "Meetings" },
    { name: "B After", id: "b6", area: "Cosmos", use: "Meetings" },
    { name: "w(room)", id: "b7", area: "Cosmos", use: "Meetings" },
    { name: "MF Room", id: "b10", area: "Cosmos", use: "Studio / Makers space" },
    { name: "Han’s Zimmer", id: "b12", area: "Cosmos", use: "Workspaces" },
    { name: "Dark Matter", id: "b14", area: "Cosmos", use: "Learning units" },
    { name: "Cape Canaveral", id: "b15", area: "Cantina", use: "Team spaces" },
    { name: "Otter Space", id: "b16", area: "Cantina", use: "Team spaces" },
    { name: "B.17 (Strategist)", id: "b17", area: "Data Core", use: "Workspaces" },
    { name: "B.18 (Archivist)", id: "b18", area: "Data Core", use: "Workspaces" },
    { name: "B.19 (Analyst)", id: "b19", area: "Data Core", use: "Workspaces" },
    { name: "B.20", id: "b20", area: "Data Core", use: "Workspaces" }, // Placeholder
    { name: "B.21", id: "b21", area: "Data Core", use: "Workspaces" }, // Placeholder
    { name: "Artemis Student Service Desk", id: "b22", area: "Garden", use: "Team spaces" },
    { name: "Pluto Family Room", id: "b23", area: "Garden", use: "Team spaces" },

    // --- SPECIAL ROOMS (GLB Names) ---
    { name: "Makers Space", id: "labmakerspace", area: "Hive", use: "Studio / Makers space" },
    { name: "Hydrogen Terrace", id: "terracehydrogen", area: "Cosmos", use: "Terrace + Balcony" },
    { name: "Oxygen Terrace", id: "terraceoxygen", area: "Cantina", use: "Terrace + Balcony" },

    // --- SERVICE / INFRASTRUCTURE ---
    { name: "Lifts 01", id: "lifts", area: "Service", use: "Circulation" },
    { name: "Lifts 02", id: "lifts02", area: "Service", use: "Circulation" },
    { name: "Lifts 03", id: "lifts03", area: "Service", use: "Circulation" },
    { name: "Restrooms/Exits 01", id: "restroomsexits01", area: "Service", use: "Service" },
    { name: "Restrooms/Exits 02", id: "restroomsexits02", area: "Service", use: "Service" }
];


// Trait Mapping
const oceanMapping = {
    'Explosive Optimist': 'innovator',
    'Charismatic Connector': 'ambassador',
    'Melancholic Omniscience': 'analyst',
    'Resentful Guardian': 'sentinel',
    'Fierce Protector': 'commander',
    'Stoic Logician': 'analyst',
    'Ingenious Tinkerer': 'innovator',
    'Mission Focused': 'architect',
    'Elusive Influence': 'architect',
    'Emotive Architect of Sound': 'aesthete',
    'Harmonic Tuner': 'optimizer',
    'High-Speed Strategist': 'maverick',
    'Reflective Analyst': 'analyst',
    'Mindful Anchor': 'anchor',
    'Anticipatory Planner': 'architect',
    'Harmonious Mediator': 'ambassador',
    'Playful Pacifist': 'advocate',
    'Abstract Muse': 'aesthete',
    'Inquisitive Catalyst': 'challenger',
    'Unflappable Coordinator': 'commander',
    'Obsessive Organizer': 'optimizer',
    'Silent Observer': 'sentinel',
    'Resourceful Creator': 'innovator',
    'Unified Consciousness': 'ambassador',
    'Untamed Creativity': 'maverick',
    'Ambitious Builder': 'architect'
};

// Index Maps for Helpers
const personalityMap = new Map();
roomsPersonalities.forEach(p => {
    personalityMap.set(p.id.toLowerCase(), p);
    personalityMap.set(p.id.toLowerCase().replace(/[^a-z0-9]/g, ''), p);
    // Also index by name or other variants if needed, but ID is safest
});

const oceanMap = new Map();
oceanPersonalities.personalities.forEach(p => oceanMap.set(p.id, p));

// Explicit mappings from GLB ID to Personality ID
const idOverrides = {
    'labmakerspace': 'a5', // Maps "labmakerspace" GLB mesh to "a5" (Makers Space) personality
    'terracehydrogen': 'hydrogen',
    'terraceoxygen': 'oxygen', // Assuming there is an oxygen personality? (checked: no 'oxygen' personality in JSON, see below)
    'a11': 'a11-a12',
    // 'a12' no longer exists in list
};

function getAgentData(roomId) {
    if (!roomId) return null;
    let lookupId = roomId.toString().toLowerCase();

    // Check overrides
    if (idOverrides[lookupId]) {
        lookupId = idOverrides[lookupId];
    }

    // Special handling for merged IDs like "a11, a12" -> "a11-a12"
    if (lookupId.includes(',')) {
        const parts = lookupId.split(',').map(s => s.trim());
        // Try finding "a11-a12" if user input was "a11, a12"
        // The JSON file has "a11-a12" for "TETandRIS"
        if (parts.length > 1) {
            const hyphenated = parts.join('-');
            if (personalityMap.has(hyphenated)) lookupId = hyphenated; // e.g. a11-a12
            // Some JSON keys are just 'a.11-a.12' in the Loader logic, but the JSON file has 'a11-a12' or 'TETandRIS'?
            // Let's check the JSON file content from memory/previous step. 
            // Line 339 of rooms_personalities.json is "id": "a11-a12".
        }
    }

    let personality = personalityMap.get(lookupId);
    if (!personality) {
        const cleanId = lookupId.replace(/[^a-z0-9]/g, '');
        personality = personalityMap.get(cleanId);
    }

    // Last ditch: try finding by mapped "old" IDs? 
    // The previous PersonalityLoader had a mapping table. 
    // "b19" -> "b19" (The Analyst)
    // "b18" -> "b18" (The Archivist)
    // "b17" -> "b17" (The Strategist)

    if (!personality) return null;

    // Merge OCEAN
    const oceanId = oceanMapping[personality.trait] || 'analyst';
    const oceanProfile = oceanMap.get(oceanId);

    // Ensure icon and voice are present
    // JSON keys: "icon", "voice"

    return {
        ...personality,
        ocean: oceanProfile
    };
}

// Generate Unified List
const unifiedRooms = roomsList.map(room => {
    const rawAgent = getAgentData(room.id);

    let agentData = null;
    if (rawAgent) {
        agentData = {
            id: rawAgent.id,
            name: rawAgent['room-name'] || rawAgent.name, // prefer JSON name
            icon: rawAgent.icon,
            voice: rawAgent.voice,
            trait: rawAgent.trait,
            base_story: rawAgent.base_story,
            visual_descriptors: rawAgent.visual_descriptors,
            ocean: rawAgent.ocean
            // Add other top-level keys from rawAgent if needed?
        };
    }

    // Prepare Sensor Data (granular template)
    // If we had real data sources, we'd map them here. 
    // For now, use the template structure requested.
    const sensorData = {
        environmental: {
            temperature: null,
            humidity: null,
            co2: null
        },
        occupancy: {
            isOccupied: false,
            count: 0
        },
        activity: {
            noiseLevel: null,
            brightness: null
        }
    };

    // Chat History
    const chatHistory = [];

    // Reservations
    const reservations = {
        // NOTE: Synced with Google Calendar
        status: "available",
        currentEvent: null,
        upcomingEvents: []
    };

    return {
        id: room.id,
        roomData: {
            name: room.name,
            area: room.area,
            use: room.use
        },
        agentData: agentData, // can be null if not found (e.g. Balcony)
        sensorData,
        chatHistory,
        reservations
    };
});

// Write to File
const fileContent = `/**
 * unified_rooms_data.js
 * 
 * Static generated file containing the Unified Data Structure for all rooms.
 * Combines Room Config, Agent Personalities (OCEAN), and Sensor Templates.
 * 
 * Generated by src/tools/generate_unified_data.js
 */

export const unifiedRooms = ${JSON.stringify(unifiedRooms, null, 2)};
export const rooms = unifiedRooms;

export default unifiedRooms;
`;

fs.writeFileSync(outputPath, fileContent);
console.log(`Successfully generated unified_rooms_data.js at ${outputPath}`);
