// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // Add framework plugins here, e.g.:
    // react(),
    // vue(),
  ],
  // Optional: Configure base path if deploying to a subdirectory
  base: "/src/",
  build: {
    // Optional: Configure build output directory
    outDir: "dist",
  },
  server: {
    // Optional: Configure development server port
    port: 3000,
  },
});
