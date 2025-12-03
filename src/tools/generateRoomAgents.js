import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const PERSONALITIES_PATH = path.join(__dirname, '../data/personalities/rooms_personalities.json');
const OUTPUT_PATH = path.join(__dirname, '../data/agents/room-agents-config.json');

// Template for GPT-OSS-20B
const AGENT_TEMPLATE = {
    "id": "${id}",
    "name": "${room-name} Agent",
    "model": "mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx",
    "instructions": "<|start_header_id|>harmony<|end_header_id|>\n\nReasoning: high\n\nYou are ${room-name}, a ${room-category}. Your personality is: ${trait}. Your primary desire is: ${want}. Your flaw is: ${flaw}. Your backstory: ${base_story}. Use ${voice} as your voice reference. Your interface should feel like: ${visual_descriptors}. You have access to real-time sensor data and calendar events for your room. Always respond in-character, interpreting data and events through your unique personality.",
    "tools": [
        {
            "type": "function",
            "function": {
                "name": "get_room_sensors",
                "description": "Get current sensor readings for ${room-name}",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "sensor_types": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "enum": ["all", "occupancy", "temperature", "humidity", "air_quality", "battery", "energy", "illumination", "other"]
                            },
                            "description": "Types of sensors to retrieve data from"
                        }
                    }
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_calendar_events",
                "description": "Get upcoming events scheduled for ${room-name}",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "time_range": {
                            "type": "string",
                            "enum": ["now", "today", "this_week", "next_week", "this_month"],
                            "description": "Time range for calendar events"
                        }
                    }
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_room_status",
                "description": "Get comprehensive room status including occupancy, environmental conditions, and next events",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            }
        }
    ],
    "metadata": {
        "room_identity": {
            "id": "${id}",
            "name": "${room-name}",
            "category": "${room-category}",
            "icon": "${icon}",
            "avatar": "${room-avatar}",
            "voice_reference": "${voice}",
            "visual_theme": "${visual_descriptors}"
        },
        "personality_profile": {
            "trait": "${trait}",
            "desire": "${want}",
            "flaw": "${flaw}",
            "backstory": "${base_story}"
        },
        "conversations": {
            "description": "Array to hold the full history of chat sessions for this room agent.",
            "schema": [
                {
                    "session_id": "string",
                    "messages": [
                        {
                            "role": "string ('user', 'assistant', 'tool')",
                            "content": "string or object",
                            "tool_calls": "array (optional)",
                            "tool_call_id": "string (optional)"
                        }
                    ],
                    "created_at": "datetime",
                    "updated_at": "datetime"
                }
            ],
            "management_notes": "To manage token limits, implement a sliding window or summarization strategy[citation:5]. New sessions should be created for distinct conversations or users."
        }
    }
};

async function generateAgents() {
    try {
        // 1. Load Personalities
        if (!fs.existsSync(PERSONALITIES_PATH)) {
            console.error(`❌ Personalities file not found at: ${PERSONALITIES_PATH}`);
            process.exit(1);
        }

        const personalitiesData = JSON.parse(fs.readFileSync(PERSONALITIES_PATH, 'utf-8'));
        const agents = [];

        // 2. Generate Agent Config for each room
        // Assuming personalitiesData is keyed by roomId or is an array of objects
        // Adjusting based on common structure: { "room-id": { ...data } } or [ { id: "room-id", ... } ]

        const entries = Array.isArray(personalitiesData)
            ? personalitiesData.map(p => [p.id, p])
            : Object.entries(personalitiesData);

        // Kokoro Voices
        const FEMALE_VOICES = [
            "af_bella", "af_sarah", "af_nicole", "af_sky", "bf_alice", "bf_emma", "bf_isabella", "af_jessica"
        ];
        const MALE_VOICES = [
            "am_adam", "am_michael", "bm_daniel", "bm_george", "am_eric", "am_liam", "bm_lewis", "am_echo"
        ];

        let voiceIndex = 0;

        for (const [roomId, data] of entries) {
            let configStr = JSON.stringify(AGENT_TEMPLATE);

            // Deterministic voice assignment based on room ID hash or simple rotation
            // Simple rotation for now to ensure diversity
            const isMale = (roomId.length % 2 === 0); // Arbitrary split
            const voices = isMale ? MALE_VOICES : FEMALE_VOICES;
            const assignedVoice = voices[voiceIndex % voices.length];
            voiceIndex++;

            // Replacements
            const replacements = {
                "${id}": roomId,
                "${room-name}": data.name || roomId,
                "${room-category}": data.category || "Room",
                "${trait}": data.personality?.trait || "Neutral",
                "${want}": data.personality?.desire || "To function efficiently",
                "${flaw}": data.personality?.flaw || "None",
                "${base_story}": data.personality?.backstory || "I am a smart room.",
                "${voice}": assignedVoice, // Use specific Kokoro voice ID
                "${visual_descriptors}": data.personality?.visual_theme || "Clean, modern interface",
                "${icon}": data.icon || "default-icon",
                "${room-avatar}": data.avatar || "default-avatar"
            };

            // Perform replacements
            for (const [key, value] of Object.entries(replacements)) {
                configStr = configStr.split(key).join(value);
            }

            agents.push(JSON.parse(configStr));
        }

        // 3. Write Output
        const outputDir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(agents, null, 2));
        console.log(`✅ Generated ${agents.length} agent configurations at: ${OUTPUT_PATH}`);

    } catch (error) {
        console.error("❌ Error generating agents:", error);
    }
}

generateAgents();
