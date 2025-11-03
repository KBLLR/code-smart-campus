// src/data/labelCollections.js
// Central place to expose cleaned registry data and grouped metadata for UI layers.

import { labelRegistry as rawLabelRegistry } from "@registries/labelRegistry.js";
import { sanitizeLabelRegistry } from "@utils/labelRegistryUtils.js";

const { registry: cleanedLabelRegistry, categories: labelCategories } =
  sanitizeLabelRegistry(rawLabelRegistry);

export { cleanedLabelRegistry, labelCategories };

