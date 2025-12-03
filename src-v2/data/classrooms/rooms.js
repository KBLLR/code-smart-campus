const rooms = [
    // CANTINA side
    { name: "Houston", id: "A14", area: "Cantina", use: "Team spaces" },
    { name: "Cape Canaveral", id: "B15", area: "Cantina", use: "Team spaces" },
    { name: "Otter Space", id: "B16", area: "Cantina", use: "Team spaces" },

    // COSMOS community space
    { name: "Dark Matter", id: "B14", area: "Cosmos", use: "Learning units" },
    { name: "Tet Ris", id: "A11, A12", area: "Cosmos", use: "Learning units" },
    { name: "Han’s Zimmer", id: "B12", area: "Cosmos", use: "Workspaces" },
    { name: "MF Room", id: "B10", area: "Cosmos", use: "Studio / Makers space" },
    { name: "w(room)", id: "B7", area: "Cosmos", use: "Meetings" },
    { name: "B After", id: "B6", area: "Cosmos", use: "Meetings" },
    { name: "B Present", id: "B5", area: "Cosmos", use: "Meetings" },

    // Strip between Cosmos / Garden (closer to Garden)
    { name: "B.4", id: "B4", area: "Garden", use: "Meetings" },
    { name: "Peace", id: "B3", area: "Garden", use: "Meetings" },
    { name: "Aang", id: "B2", area: "Garden", use: "Meditation space" },

    // GARDEN side
    { name: "Pluto Family Room", id: "B23", area: "Garden", use: "Team spaces" },
    { name: "Artemis Student Service Desk", id: "B22", area: "Garden", use: "Team spaces" },
    { name: "Babylon", id: "A1", area: "Garden", use: "Meetings" },
    { name: "Jungle", id: "A2", area: "Garden", use: "Learning units" },
    { name: "Pandora", id: "A24", area: "Garden", use: "Learning units" },

    // HIVE project side
    { name: "Muted", id: "A6", area: "Hive", use: "Workspaces" },
    { name: "Makers Space", id: "A5", area: "Hive", use: "Studio / Makers space" },
    { name: "HIVE Project Space", id: "A3", area: "Hive", use: "Project" },

    // Terrace / balcony & library (no A/B id on the map)
    { name: "Oxygen", id: null, area: "Cantina", use: "Terrace + Balcony" },
    { name: "Hydrogen", id: null, area: "Cosmos", use: "Terrace + Balcony" },
    { name: "Alexandria – Library", id: null, area: "Cosmos", use: "Workspaces" },
    { name: "B Square Balcony", id: null, area: "Balcony", use: "Terrace + Balcony" }
];

export default rooms;
