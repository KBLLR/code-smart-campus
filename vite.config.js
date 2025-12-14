import { defineConfig } from "vite";
// Trigger restart
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import dotenv from "dotenv";
// Disabled for minimal setup - these plugins require node-html-parser
// import labelRegistryDevPlugin from "./vite.server.js";
// import classroomApiPlugin from "./vite.classroom-api.js";

import { sensorHistoryPlugin } from "./vite.sensor-history.js";

dotenv.config();

export default defineConfig({
  root: ".",
  server: {
    open: true,
    proxy: {
      // 1. Tier 1 Backend Routes (MLX, Voice, Calendar) -> Port 3001
      "^/api/(mlx|integrations|voice-chat|save-file)": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
      // 2. Home Assistant Routes -> Port 8123 (Default)
      "/api": {
        target: process.env.VITE_HA_PROXY_TARGET || "http://localhost:8123",
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
        // Bypass proxy for classroom API routes when using local plugin
        bypass: (req, res, options) => {
          // Only bypass if using local Vite plugin (not Phase-4 mode)
          if (process.env.VITE_USE_LOCAL_CLASSROOM_PLUGIN === 'true' && req.url.startsWith('/api/classrooms')) {
            return req.url; // Don't proxy, let the plugin handle it
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@components": path.resolve(__dirname, "./src/ui/components"),
      "@molecules": path.resolve(__dirname, "./src/ui/components/molecules"),
      "@atoms": path.resolve(__dirname, "./src/ui/components/atoms"),
      "@organisms": path.resolve(__dirname, "./src/ui/components/organisms"),
      "@home_assistant": path.resolve(__dirname, "./src/home_assistant"),
      "@data": path.resolve(__dirname, "./src/data"),
      "@registries": path.resolve(__dirname, "./src/registries"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@ui": path.resolve(__dirname, "./src/ui"),
      "@widgets": path.resolve(__dirname, "./src/ui/widgets"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@three": path.resolve(__dirname, "./src/three"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@debug": path.resolve(__dirname, "./src/debug"),
      "@panes": path.resolve(__dirname, "./src/debug/panes"),
      "@tools": path.resolve(__dirname, "./src/tools"),
      "@network": path.resolve(__dirname, "./src/network"),
      "@hud": path.resolve(__dirname, "./src/hud"),
      "@interaction": path.resolve(__dirname, "./src/interaction"),
    },
  },
  optimizeDeps: {
    include: [
      "three",
      "three/examples/jsm/controls/OrbitControls",
      "three/examples/jsm/loaders/GLTFLoader",
      "three/examples/jsm/loaders/DRACOLoader",
      "three/examples/jsm/postprocessing/EffectComposer",
      "three/examples/jsm/postprocessing/RenderPass",
      "three/examples/jsm/postprocessing/UnrealBloomPass",
    ],
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        sensors: path.resolve(__dirname, "sensors.html"),
      },
    },
  },
  plugins: [
    // Disabled for minimal setup
    // labelRegistryDevPlugin(),
    // classroomApiPlugin(),
    sensorHistoryPlugin(),
    tailwindcss()
  ],
  experimental: {
    renderBuiltUrl(filename) {
      // Handle WASM files properly in production builds
      if (filename.endsWith(".wasm")) {
        return { relative: true };
      }
      return { relative: true };
    },
  },
});
