import fs from "fs";
import path from "path";
import { generate as generateLabels } from "./src/tools/generateLabelRegistry.js";
import { generate as generateRooms } from "./src/tools/generateRoomRegistry.js";

export default function labelRegistryDevPlugin() {
  return {
    name: "label-registry-api",
    configureServer(server) {
      // /api/generate-labels
      server.middlewares.use("/api/generate-labels", async (req, res) => {
        try {
          const count = await generateLabels();
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, count }));
        } catch (err) {
          console.error("❌ API /generate-labels failed", err);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });

      // /api/generate-room-registry
      server.middlewares.use(
        "/api/generate-room-registry",
        async (req, res) => {
          try {
            const count = await generateRooms();
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true, count }));
          } catch (err) {
            console.error("❌ API /generate-room-registry failed", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        },
      );
    },
  };
}
