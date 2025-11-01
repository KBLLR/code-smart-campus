import generateLabels from "./src/api/generate-labels.js";

export function labelRegistryDevPlugin() {
  return {
    name: "label-registry-dev-plugin",
    configureServer(server) {
      server.middlewares.use("/api/generate-labels", async (req, res) => {
        if (req.method === "GET") return generateLabels(req, res);
      });
    },
  };
}
