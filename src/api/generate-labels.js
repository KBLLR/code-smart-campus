// src/api/generate-labels.js
import { generate } from "../tools/generateLabelRegistry.js";

export default async function generateLabels(req, res) {
  try {
    const count = await generate();
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ count }));
  } catch (err) {
    console.error("❌ /api/generate-labels failed:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Label generation failed." }));
  }
}
