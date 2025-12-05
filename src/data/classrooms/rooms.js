const rooms = [
    // CANTINA side
    { name: "Houston", id: "a14", area: "Cantina", use: "Team spaces" },
    { name: "Cape Canaveral", id: "b15", area: "Cantina", use: "Team spaces" },
    { name: "Otter Space", id: "b16", area: "Cantina", use: "Team spaces" },

    // COSMOS community space
    { name: "Dark Matter", id: "b14", area: "Cosmos", use: "Learning units" },
    { name: "Tet Ris", id: "a11, a12", area: "Cosmos", use: "Learning units" },
    { name: "Han’s Zimmer", id: "b12", area: "Cosmos", use: "Workspaces" },
    { name: "MF Room", id: "b10", area: "Cosmos", use: "Studio / Makers space" },
    { name: "w(room)", id: "b7", area: "Cosmos", use: "Meetings" },
    { name: "B After", id: "b6", area: "Cosmos", use: "Meetings" },
    { name: "B Present", id: "b5", area: "Cosmos", use: "Meetings" },

    // Strip between Cosmos / Garden (closer to Garden)
    { name: "B.4", id: "b4", area: "Garden", use: "Meetings" },
    { name: "Peace", id: "b3", area: "Garden", use: "Meetings" },
    { name: "Aang", id: "b2", area: "Garden", use: "Meditation space" },

    // GARDEN side
    { name: "Pluto Family Room", id: "b23", area: "Garden", use: "Team spaces" },
    { name: "Artemis Student Service Desk", id: "b22", area: "Garden", use: "Team spaces" },
    { name: "Babylon", id: "a1", area: "Garden", use: "Meetings" },
    { name: "Jungle", id: "a2", area: "Garden", use: "Learning units" },
    { name: "Pandora", id: "a24", area: "Garden", use: "Learning units" },

    // HIVE project side
    { name: "Muted", id: "a6", area: "Hive", use: "Workspaces" },
    { name: "Makers Space", id: "a5", area: "Hive", use: "Studio / Makers space" },
    { name: "HIVE Project Space", id: "a3", area: "Hive", use: "Project" },

    // Terrace / balcony & library (no A/B id on the map)
    { name: "Oxygen", id: null, area: "Cantina", use: "Terrace + Balcony" },
    { name: "Hydrogen", id: null, area: "Cosmos", use: "Terrace + Balcony" },
    { name: "Alexandria – Library", id: null, area: "Cosmos", use: "Workspaces" },
    { name: "B Square Balcony", id: null, area: "Balcony", use: "Terrace + Balcony" }
];

export default rooms;
