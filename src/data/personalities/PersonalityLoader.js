/**
 * PersonalityLoader.js
 * Loads and merges room personalities with OCEAN framework
 */

import roomsPersonalities from './rooms_personalities.json' with { type: 'json' };
import oceanPersonalities from './ocean-personalities.json' with { type: 'json' };

class PersonalityLoader {
    constructor() {
        this.roomPersonalities = new Map();
        this.oceanPersonalities = new Map();
        this.roomIdMapping = this._createRoomIdMapping();
        this._loadPersonalities();
    }

    _createRoomIdMapping() {
        // Map various ID formats to personality IDs
        return {
            'makerspace': 'a.5',
            'hive': 'a.3',
            'kitchen': 'kitchen',
            'library': 'library',
            'cantina': 'kitchen',
            // Normalize uppercase room codes to lowercase
            'a1': 'a.1',
            'a2': 'a.2',
            'a3': 'a.3',
            'a5': 'a.5',
            'a6': 'a.6',
            'a11': 'a.11-a.12',
            'a12': 'a.11-a.12',
            'a14': 'a.14',
            'a23': 'a.23',
            'a24': 'a.24',
            'a25': 'a.25',
            'a26': 'a.26',
            'b2': 'b.2',
            'b3': 'b.3',
            'b4': 'b.4',
            'b5': 'b.5',
            'b6': 'b.6',
            'b7': 'b.7',
            'b10': 'b.10',
            'b12': 'b.12',
            'b14': 'b.14',
            'b15': 'b.15',
            'b16': 'b.16',
            'b17': 'b.17',
            'b18': 'b.18',
            'b19': 'b.19',
            'b22': 'b.22',
            'b23': 'b.23'
        };
    }

    _normalizeRoomId(roomId) {
        if (!roomId) return null;

        // Convert to lowercase and remove special characters for lookup
        const normalized = roomId.toString().toLowerCase().replace(/[^a-z0-9]/g, '');

        // Check if we have a mapping
        if (this.roomIdMapping[normalized]) {
            return this.roomIdMapping[normalized];
        }

        // Try exact match first
        if (this.roomPersonalities.has(roomId)) {
            return roomId;
        }

        // Try lowercase version
        const lower = roomId.toLowerCase();
        if (this.roomPersonalities.has(lower)) {
            return lower;
        }

        // Return normalized ID as fallback
        return normalized;
    }

    _loadPersonalities() {
        // Load room personalities with multiple ID formats
        roomsPersonalities.forEach(room => {
            // Store with original ID
            this.roomPersonalities.set(room.id, room);

            // Also store with normalized ID
            const normalized = this._normalizeRoomId(room.id);
            if (normalized !== room.id) {
                this.roomPersonalities.set(normalized, room);
            }
        });

        // Load OCEAN personalities
        oceanPersonalities.personalities.forEach(personality => {
            this.oceanPersonalities.set(personality.id, personality);
        });
    }

    getRoomPersonality(roomId) {
        // Try direct lookup first
        let personality = this.roomPersonalities.get(roomId);
        if (personality) return personality;

        // Try normalized ID
        const normalizedId = this._normalizeRoomId(roomId);
        personality = this.roomPersonalities.get(normalizedId);

        return personality;
    }

    getOceanPersonality(personalityId) {
        return this.oceanPersonalities.get(personalityId);
    }

    /**
     * Get merged personality for a room
     * Combines room personality with appropriate OCEAN profile
     */
    getMergedPersonality(roomId) {
        const roomPersonality = this.getRoomPersonality(roomId);
        if (!roomPersonality) return null;

        // Map room traits to OCEAN personalities

        const oceanMapping = {
            'Explosive Optimist': 'innovator',
            'Charismatic Connector': 'ambassador',
            'Melancholic Omniscience': 'analyst', // Was archivist
            'Resentful Guardian': 'sentinel',
            'Fierce Protector': 'commander',
            'Stoic Logician': 'analyst',
            'Ingenious Tinkerer': 'innovator',
            'Mission Focused': 'architect',
            'Elusive Influence': 'architect', // Was strategist
            'Emotive Architect of Sound': 'aesthete',
            'Harmonic Tuner': 'optimizer',
            'High-Speed Strategist': 'maverick',
            'Reflective Analyst': 'analyst',
            'Mindful Anchor': 'anchor',
            'Anticipatory Planner': 'architect', // Was strategist
            'Harmonious Mediator': 'ambassador', // Was diplomat
            'Playful Pacifist': 'advocate',
            'Abstract Muse': 'aesthete',
            'Inquisitive Catalyst': 'challenger',
            'Unflappable Coordinator': 'commander',
            'Obsessive Organizer': 'optimizer',
            'Silent Observer': 'sentinel',
            'Resourceful Creator': 'innovator',
            'Unified Consciousness': 'ambassador', // Was diplomat
            'Untamed Creativity': 'maverick',
            'Ambitious Builder': 'architect'
        };

        const oceanId = oceanMapping[roomPersonality.trait] || 'analyst';
        const oceanPersonality = this.getOceanPersonality(oceanId);

        return {
            ...roomPersonality,
            ocean: oceanPersonality
        };
    }
}

export const personalityLoader = new PersonalityLoader();
export default personalityLoader;

