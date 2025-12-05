import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["src/modules/classroom/**"],
  },
  {
    ignores: ["src/gltf-khronos+EXT/test/**", "src/modules/classroom/**"],
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
        "importScripts": "readonly", // For web workers
        "import": "readonly", // For import.meta
        "THREE": "readonly",
        "__THREE_DEVTOOLS__": "readonly",
        "WebGL2ComputeRenderingContext": "readonly",
        "QUnit": "readonly",
        "assert": "readonly",
        "define": "readonly",
        "toggleMapView": "readonly",
        "showRoomInsights": "readonly",
        "showTechStack": "readonly",
        "showBuildingDetails": "readonly",
        "showDetailedView": "readonly",
        "import.meta": "readonly",
        "import.meta.env": "readonly",
      }
    }
  },
  {
    ignores: ["src/gltf-khronos+EXT/test/**", "src/modules/classroom/**"],
    files: ["**/*.{ts,mts,cts}"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './src/tsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
        "importScripts": "readonly", // For web workers
        "import": "readonly", // For import.meta
        "THREE": "readonly",
        "__THREE_DEVTOOLS__": "readonly",
        "WebGL2ComputeRenderingContext": "readonly",
        "QUnit": "readonly",
        "assert": "readonly",
        "define": "readonly",
        "toggleMapView": "readonly",
        "showRoomInsights": "readonly",
        "showTechStack": "readonly",
        "showBuildingDetails": "readonly",
        "showDetailedView": "readonly",
        "import.meta": "readonly",
        "import.meta.env": "readonly",
      }
    }
  },
]);
