// --- START OF FILE GenColor.js (Modified) ---

import * as THREE from "three";

export default class GenColor {
  // --- Theme Palettes Definition ---
  static palettes = {
    default: ["#aaaaaa"], // Fallback
    fluor: [
      "#ff00ff", // Magenta
      "#00ffff", // Cyan
      "#ffff00", // Yellow
      "#00ff00", // Lime Green
      "#ff8000", // Orange
      "#ff0080", // Hot Pink
    ],
    pastel: [
      "#ffb3ba", // Light Pink
      "#ffdfba", // Light Peach
      "#ffffba", // Light Yellow
      "#baffc9", // Light Mint Green
      "#bae1ff", // Light Blue
      "#e0baff", // Light Lavender
    ],
    plastic: [
      // Brighter, solid primary/secondary colors
      "#ff1c1c", // Bright Red
      "#1cff1c", // Bright Green
      "#1c1cff", // Bright Blue
      "#ffff1c", // Bright Yellow
      "#ff1cff", // Bright Magenta
      "#1cffff", // Bright Cyan
      "#ffffff", // White
      "#333333", // Dark Grey / Black
    ],
    warm: [
      "#ff4e50", // Coral
      "#fc913a", // Orange Peel
      "#f9d423", // Marigold Yellow
      "#ff8c42", // Mango Tango
      "#e85d04", // Dark Orange
      "#a44a3f", // Rust
    ],
    cool: [
      "#ade8f4", // Light Sky Blue
      "#48cae4", // Medium Sky Blue
      "#00b4d8", // Bright Cerulean
      "#0077b6", // Star Command Blue
      "#03045e", // Midnight Blue
      "#90e0ef", // Lighter Blue
    ],
  };

  /**
   * Creates a GenColor instance.
   * @param {string} value - Can be a hex string OR a theme name (e.g., "pastel").
   *                         If a theme name is given, a random color from that theme is chosen.
   * @param {string} [defaultTheme='default'] - Theme to use if the value is not a valid hex or theme name.
   */
  constructor(value, defaultTheme = "default") {
    this.setColor(value, defaultTheme);
  }

  /**
   * Sets the color based on a hex string or theme name.
   * @param {string} value - Hex string or theme name.
   * @param {string} [defaultTheme='default'] - Fallback theme.
   */
  setColor(value, defaultTheme = "default") {
    let hexValue = "#aaaaaa"; // Default fallback

    if (typeof value === "string") {
      value = value.toLowerCase();
      if (value.startsWith("#") || value.startsWith("0x")) {
        // Direct Hex Value
        try {
          // Validate if it's a proper color for THREE.Color
          const tempColor = new THREE.Color(value);
          hexValue = tempColor.getHexString(THREE.SRGBColorSpace); // Get validated hex
          hexValue = `#${hexValue}`; // Ensure '#' prefix
        } catch (e) {
          console.warn(
            `[GenColor] Invalid hex value "${value}". Using default.`,
          );
          hexValue = GenColor.getRandomColorFromTheme(defaultTheme);
        }
      } else if (GenColor.palettes[value]) {
        // Theme Name Provided
        hexValue = GenColor.getRandomColorFromTheme(value);
      } else {
        // Invalid input, use default theme
        console.warn(
          `[GenColor] Unknown theme or invalid value "${value}". Using default theme '${defaultTheme}'.`,
        );
        hexValue = GenColor.getRandomColorFromTheme(defaultTheme);
      }
    } else {
      // Invalid input type
      console.warn(
        `[GenColor] Invalid input type for color value. Using default theme '${defaultTheme}'.`,
      );
      hexValue = GenColor.getRandomColorFromTheme(defaultTheme);
    }

    this.hexString = hexValue;
    // Always create a new Color object to ensure freshness
    this.rgb = new THREE.Color(); // Create new instance
    this.rgb.set(this.hexString); // Set color correctly
    this.vec3 = new THREE.Vector3(this.rgb.r, this.rgb.g, this.rgb.b);
  }

  /**
   * Gets a random hex color string from the specified theme palette.
   * @param {string} themeName - The name of the theme (e.g., 'pastel', 'fluor').
   * @returns {string} A hex color string (e.g., '#ffb3ba').
   */
  static getRandomColorFromTheme(themeName = "default") {
    const palette =
      GenColor.palettes[themeName] || GenColor.palettes["default"];
    if (!palette || palette.length === 0) {
      return "#aaaaaa"; // Absolute fallback
    }
    const randomIndex = Math.floor(Math.random() * palette.length);
    return palette[randomIndex];
  }

  /**
   * Gets the full palette array for a given theme.
   * @param {string} themeName - The name of the theme.
   * @returns {string[] | null} The array of hex strings or null if theme doesn't exist.
   */
  static getPalette(themeName) {
    return GenColor.palettes[themeName] || null;
  }
}

// --- END OF FILE GenColor.js (Modified) ---
