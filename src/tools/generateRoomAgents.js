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

        const replacePlaceholders = (obj, replacements) => {
            const str = JSON.stringify(obj);
            const replaced = Object.entries(replacements).reduce(
                (acc, [key, value]) => acc.split(key).join(value),
                str
            );
            return JSON.parse(replaced);
        };

        for (const [roomId, data] of entries) {
            const roomName = data.name || data['room-name'] || roomId;
            const roomCategory = data.category || data['room-category'] || "Room";
            const roomIcon = data.icon || data['room-icon'] || "default-icon";
            const roomAvatar = data.avatar || data['room-avatar'] || "default-avatar";
            const personality = data.personality || {};
            const trait = personality.trait || data.trait || "Neutral";
            const desire = personality.desire || data.want || "To function efficiently";
            const flaw = personality.flaw || data.flaw || "None";
            const backstory = personality.backstory || data.base_story || "I am a smart room.";
            const visualTheme = personality.visual_theme || data.visual_descriptors || "Clean, modern interface";
            const resolvedVoice = data.voice || 'af_sarah'; // Expect Kokoro preset id

            const instructions = `<|start_header_id|>harmony<|end_header_id|>

Reasoning: high

You are ${roomName}, a ${roomCategory}. Your personality is: ${trait}. Your primary desire is: ${desire}. Your flaw is: ${flaw}. Your backstory: ${backstory}. Use ${resolvedVoice} as your voice reference. Your interface should feel like: ${visualTheme}. You have access to real-time sensor data and calendar events for your room. Always respond in-character, interpreting data and events through your unique personality.`;

            const replacements = {
                "${room-name}": roomName,
                "${room-category}": roomCategory,
                "${id}": roomId
            };

            const tools = replacePlaceholders(AGENT_TEMPLATE.tools, replacements);
            const conversations = replacePlaceholders(AGENT_TEMPLATE.metadata.conversations, replacements);

            const agent = {
                id: roomId,
                name: `${roomName} Agent`,
                model: "mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx",
                instructions,
                tools,
                metadata: {
                    room_identity: {
                        id: roomId,
                        name: roomName,
                        category: roomCategory,
                        icon: roomIcon,
                        avatar: roomAvatar,
                        voice_reference: resolvedVoice,
                        visual_theme: visualTheme
                    },
                    personality_profile: {
                        trait,
                        desire,
                        flaw,
                        backstory
                    },
                    conversations
                }
            };

            agents.push(agent);
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
