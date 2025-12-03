/**
 * PersonalityLoader.js
 * Loads and merges room personalities with OCEAN framework
 */

import roomsPersonalities from './rooms_personalities.json';
import oceanPersonalities from './ocean-personalities.json';

class PersonalityLoader {
    constructor() {
        this.roomPersonalities = new Map();
        this.oceanPersonalities = new Map();
        this._loadPersonalities();
    }

    _loadPersonalities() {
        // Load room personalities
        roomsPersonalities.forEach(room => {
            this.roomPersonalities.set(room.id, room);
        });

        // Load OCEAN personalities
        oceanPersonalities.personalities.forEach(personality => {
            this.oceanPersonalities.set(personality.id, personality);
        });
    }

    getRoomPersonality(roomId) {
        return this.roomPersonalities.get(roomId);
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
            'Melancholic Omniscience': 'archivist',
            'Resentful Guardian': 'sentinel',
            'Fierce Protector': 'commander',
            'Stoic Logician': 'analyst',
            'Ingenious Tinkerer': 'innovator',
            'Mission Focused': 'architect',
            'Elusive Influence': 'strategist',
            'Emotive Architect of Sound': 'aesthete',
            'Harmonic Tuner': 'optimizer',
            'High-Speed Strategist': 'maverick',
            'Reflective Analyst': 'analyst',
            'Mindful Anchor': 'anchor',
            'Anticipatory Planner': 'strategist',
            'Harmonious Mediator': 'diplomat',
            'Playful Pacifist': 'advocate',
            'Abstract Muse': 'aesthete',
            'Inquisitive Catalyst': 'challenger',
            'Unflappable Coordinator': 'commander',
            'Obsessive Organizer': 'optimizer',
            'Silent Observer': 'sentinel',
            'Resourceful Creator': 'innovator',
            'Unified Consciousness': 'diplomat',
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
