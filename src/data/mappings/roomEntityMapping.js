export const roomEntityMapping = [
  {
    roomId: "a.5",
    title: "MakerSpace",
    aliases: ["makerspace", "maker space", "a5"],
    entityIds: [
      "light.generic_zigbee_coordinator_ezsp_makerspace_lights",
      "person.makerspace",
    ],
    entityIdPrefixes: [
      "binary_sensor.makerspace_",
      "sensor.makerspace_",
      "calendar.code_1_makerspace",
    ],
    friendlyNameIncludes: ["makerspace"],
  },
  {
    roomId: "desk",
    title: "Front Desk",
    aliases: ["desk", "front desk"],
    entityIds: [],
    entityIdPrefixes: ["sensor.macbook_pro_21_"],
    friendlyNameIncludes: ["macbook pro"],
  },
  {
    roomId: "a.6",
    title: "A.6",
    aliases: ["a6", "a.6"],
    entityIds: [],
    entityIdPrefixes: [
      "binary_sensor.a6_",
      "sensor.a6_",
      "calendar.code_1_muted_a_6",
    ],
    friendlyNameIncludes: ["a6"],
  },
  {
    roomId: "a.11-a.12",
    title: "A.11–A.12",
    aliases: ["a11", "a12", "tet a11", "a11-a12", "a.11", "a.12"],
    entityIds: [],
    entityIdPrefixes: ["calendar.code_1_tet_a_11"],
    friendlyNameIncludes: ["a11", "a12", "tet"],
  },
  {
    roomId: "a.2",
    title: "A.2",
    aliases: ["a2", "jungle", "a.2"],
    entityIds: [],
    entityIdPrefixes: ["calendar.code_1_jungle_a_2"],
    friendlyNameIncludes: ["a2", "jungle"],
  },
  {
    roomId: "b.14",
    title: "B.14",
    aliases: ["b14", "dark matter", "b.14"],
    entityIds: [],
    entityIdPrefixes: ["calendar.code_1_dark_matter_b_14"],
    friendlyNameIncludes: ["b14", "dark matter"],
  },
  {
    roomId: "b.4",
    title: "B.4",
    aliases: ["b4", "b.4"],
    entityIds: [],
    entityIdPrefixes: ["binary_sensor.b4_", "sensor.b4_"],
    friendlyNameIncludes: ["b4"],
  },
  {
    roomId: "b.5",
    title: "B.5",
    aliases: ["b5", "b.5"],
    entityIds: [],
    entityIdPrefixes: ["binary_sensor.b5_"],
    friendlyNameIncludes: ["b5"],
  },
  {
    roomId: "b.6",
    title: "B.6",
    aliases: ["b6", "b.6"],
    entityIds: [],
    entityIdPrefixes: ["binary_sensor.b6_", "sensor.b6_"],
    friendlyNameIncludes: ["b6"],
  },
  {
    roomId: "b.7",
    title: "B.7",
    aliases: ["b7", "b.7"],
    entityIds: [],
    entityIdPrefixes: ["binary_sensor.b7_", "sensor.b7_"],
    friendlyNameIncludes: ["b7"],
  },
];

export function resolveRoomMeta({ entityId, friendlyName }) {
  const id = entityId?.toLowerCase?.() ?? "";
  const name = friendlyName?.toLowerCase?.() ?? "";
  if (!id && !name) return null;

  for (const mapping of roomEntityMapping) {
    if (mapping.entityIds?.includes(entityId)) {
      return mapping;
    }
    if (
      mapping.entityIdPrefixes?.some((prefix) =>
        id.startsWith(prefix.toLowerCase()),
      )
    ) {
      return mapping;
    }
    if (
      mapping.friendlyNameIncludes?.some((needle) =>
        name.includes(needle.toLowerCase()),
      )
    ) {
      return mapping;
    }
    if (
      mapping.aliases?.some((alias) => {
        const token = alias.toLowerCase();
        return id.includes(token) || name.includes(token);
      })
    ) {
      return mapping;
    }
  }
  return null;
}
