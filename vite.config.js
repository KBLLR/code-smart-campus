import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import dotenv from "dotenv";
import { labelRegistryDevPlugin } from "./vite.api.js";

dotenv.config();

export default defineConfig({
  root: ".",
  server: {
    open: true,
    proxy: {
      "/api": {
        target: "https://rehvwt2m9uw7pkdyqcuta2lmai6wgzei.ui.nabu.casa",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
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
      "@three": path.resolve(__dirname, "./src/three"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@debug": path.resolve(__dirname, "./src/debug"),
      "@panes": path.resolve(__dirname, "./src/debug/panes"),
      "@tools": path.resolve(__dirname, "./src/tools"),
      "@network": path.resolve(__dirname, "./src/network"),
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
  plugins: [labelRegistryDevPlugin(), tailwindcss()],
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
