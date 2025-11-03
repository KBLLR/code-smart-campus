// src/utils/labelRegistryUtils.js
// Utility helpers to keep the label registry tidy and expose category metadata.

const CATEGORY_CONFIG = {
  scheduling: {
    key: "scheduling",
    label: "Scheduling",
    icon: "calendar",
    order: 10,
    themeToken: "--accent",
  },
  occupancy: {
    key: "occupancy",
    label: "Occupancy",
    icon: "occupancy",
    order: 20,
    themeToken: "--primary",
  },
  environment: {
    key: "environment",
    label: "Environment",
    icon: "temperature",
    order: 30,
    themeToken: "--secondary",
  },
  lighting: {
    key: "lighting",
    label: "Lighting",
    icon: "light",
    order: 40,
    themeToken: "--accent",
  },
  energy: {
    key: "energy",
    label: "Energy",
    icon: "plug",
    order: 50,
    themeToken: "--accent",
  },
  people: {
    key: "people",
    label: "People",
    icon: "person",
    order: 60,
    themeToken: "--accent",
  },
  global: {
    key: "global",
    label: "Global Context",
    icon: "sun",
    order: 70,
    themeToken: "--secondary",
  },
  misc: {
    key: "misc",
    label: "Miscellaneous",
    icon: "help-circle",
    order: 90,
    themeToken: "--light",
  },
};

const TYPE_TO_CATEGORY = {
  calendar: "scheduling",
  occupancy: "occupancy",
  temperature: "environment",
  humidity: "environment",
  air_quality: "environment",
  airquality: "environment",
  climate: "environment",
  light: "lighting",
  illuminance: "lighting",
  switch: "lighting",
  power: "energy",
  energy: "energy",
  battery: "energy",
  media: "energy",
  person: "people",
  people: "people",
  global: "global",
  sun: "global",
  sensor: "environment",
  binary_sensor: "environment",
  generic: "misc",
  unknown: "misc",
};

const ICON_FALLBACKS = {
  temperature: "temperature",
  humidity: "humidity",
  air_quality: "air",
  occupancy: "occupancy",
  calendar: "calendar",
  climate: "climate",
  light: "light",
  switch: "switch",
  power: "plug",
  energy: "plug",
  media: "play",
  person: "person",
  global: "sun",
  misc: "help-circle",
};

/**
 * Returns a normalised label type suitable for downstream grouping.
 * @param {string} type
 * @returns {string}
 */
export function normalizeLabelType(type) {
  if (!type) return "generic";
  return String(type).toLowerCase().trim() || "generic";
}

/**
 * Returns the category key that should be used for the provided label type.
 * @param {string} type
 * @returns {string}
 */
export function getCategoryForType(type) {
  const normalised = normalizeLabelType(type);
  return TYPE_TO_CATEGORY[normalised] || "misc";
}

/**
 * Makes sure a registry entry has a sensible icon. Prefers the entry icon, then type, then category.
 */
function resolveIcon(entry, type, categoryKey) {
  if (entry?.icon && entry.icon !== "unknown") return entry.icon;
  if (ICON_FALLBACKS[type]) return ICON_FALLBACKS[type];
  const cat = CATEGORY_CONFIG[categoryKey];
  if (cat?.icon) return cat.icon;
  return ICON_FALLBACKS.misc;
}

/**
 * Sanitises the label registry by:
 * - removing duplicates (prefers lower priority value)
 * - mapping each entry to a category and icon
 * - normalising metadata for UI consumption
 *
 * @param {Record<string, object>} registry
 * @returns {{ registry: Record<string, object>, categories: Array<object> }}
 */
export function sanitizeLabelRegistry(registry = {}) {
  const dedupeMap = new Map(); // key => { id, entry }
  const cleanedEntries = [];
  const categories = new Map(); // categoryKey => meta

  Object.entries(registry).forEach(([entityId, entry]) => {
    if (!entry || !entry.room || !entry.label) return;

    const type = normalizeLabelType(entry.type);
    const categoryKey = getCategoryForType(type);

    const dedupeKey = `${categoryKey}|${entry.room.toLowerCase()}|${entry.label.toLowerCase()}`;
    const priority = Number.isFinite(Number(entry.priority))
      ? Number(entry.priority)
      : 99;

    const payload = {
      ...entry,
      type,
      category: categoryKey,
      priority,
      icon: resolveIcon(entry, type, categoryKey),
      entityId,
    };

    const existing = dedupeMap.get(dedupeKey);
    if (existing) {
      // Prefer the entry with the lower priority value.
      if (priority < existing.priority) {
        dedupeMap.set(dedupeKey, { priority, payload });
      }
      return;
    }
    dedupeMap.set(dedupeKey, { priority, payload });
  });

  dedupeMap.forEach(({ payload }) => {
    cleanedEntries.push([payload.entityId, payload]);

    const catKey = payload.category;
    if (!categories.has(catKey)) {
      const config = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.misc;
      categories.set(catKey, {
        key: config.key,
        label: config.label,
        icon: config.icon,
        order: config.order,
        themeToken: config.themeToken,
        count: 0,
        types: new Set(),
      });
    }
    const meta = categories.get(catKey);
    meta.count += 1;
    meta.types.add(payload.type);
  });

  cleanedEntries.sort(([, a], [, b]) => {
    const catOrderA =
      CATEGORY_CONFIG[a.category]?.order ?? CATEGORY_CONFIG.misc.order;
    const catOrderB =
      CATEGORY_CONFIG[b.category]?.order ?? CATEGORY_CONFIG.misc.order;
    if (catOrderA !== catOrderB) return catOrderA - catOrderB;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.label.localeCompare(b.label, "en", { sensitivity: "base" });
  });

  const cleanedRegistry = Object.fromEntries(cleanedEntries);
  const orderedCategories = Array.from(categories.values())
    .map((meta) => ({
      ...meta,
      types: Array.from(meta.types).sort(),
    }))
    .sort((a, b) => a.order - b.order);

  return { registry: cleanedRegistry, categories: orderedCategories };
}

export { CATEGORY_CONFIG, TYPE_TO_CATEGORY };

