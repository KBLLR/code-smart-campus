// src/ui/makeTextTexture.js
import * as THREE from "three";

function getLabelColor(entityId) {
  const id = (entityId || "").toString().toLowerCase();
  if (id.includes("temperature") || id.includes("temp")) return "#F87171"; // red
  if (id.includes("humidity")) return "#38BDF8"; // sky
  if (id.includes("voc") || id.includes("air")) return "#A78BFA"; // purple
  if (id.includes("occupancy")) return "#34D399"; // green
  if (id.includes("calendar") || id.includes("light")) return "#FBBF24"; // amber
  return "#E5E7EB"; // default gray
}

export function makeTextTexture(text = "Label", entityId = "") {
  const fontSize = 13;
  const paddingX = 16;
  const paddingY = 8;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = `${fontSize}px 'JetBrains Mono', 'Inter', 'Segoe UI', sans-serif`;
  const textWidth = context.measureText(text).width;

  canvas.width = Math.ceil(textWidth + paddingX * 2);
  canvas.height = fontSize + paddingY * 2;
  context.font = `${fontSize}px 'JetBrains Mono', 'Inter', 'Segoe UI', sans-serif`;

  // Draw capsule background
  const radius = canvas.height / 2;
  const color = getLabelColor(entityId);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(radius, 0);
  context.lineTo(canvas.width - radius, 0);
  context.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
  context.lineTo(canvas.width, canvas.height - radius);
  context.quadraticCurveTo(
    canvas.width,
    canvas.height,
    canvas.width - radius,
    canvas.height,
  );
  context.lineTo(radius, canvas.height);
  context.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
  context.lineTo(0, radius);
  context.quadraticCurveTo(0, 0, radius, 0);
  context.fill();

  // Draw text
  context.fillStyle = "#111";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
