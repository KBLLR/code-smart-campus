# Room Views Project

## Project Charter
Create character-driven “room views” that appear whenever a user selects a room on the 3D campus. Each view combines a conversational chat panel (the room speaks in first person), a placeholder for the room’s avatar/character, and quick actions (scheduling insights, sensor stats, recent changes). Persona data is bootstrapped from:
- `src/data/mappings/rooms_personalities.json`
- `src/data/mappings/personalities.json`

## Objectives & Outcomes
- Deliver a reusable room view UI module that can be summoned from raycast selection.
- Wire up room-specific personas (name, tone, voice) and present tailored greetings + action cards.
- Embed a lightweight chat interface that lets the user “talk” to the room (UX stub for now).
- Ensure the layout supports future character art/animation on the left, chat pane on the right.

## Stakeholders & Reviewers
- **Product / Narrative**: David Caballero  
- **3D Interaction**: Codex / 3D Experience squad  
- **AI/Persona Data**: Data pipeline owners (persona JSON)  
- **QA**: Claude QA agent

## Key Dependencies
- `src/interaction/RoomSelectionController.js` (raycast events)
- `rooms_personalities.json` / `personalities.json`
- Shared UI tokens (`src/styles/main.css`, future component library)

## Artifacts
- Task backlog: `tasks.md`
- Session logs: `sessions/`
- Persona specs / exploration: `future-features/`
