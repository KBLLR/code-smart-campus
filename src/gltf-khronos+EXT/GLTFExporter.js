import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

export function exportToGLTF(scene, options = {}) {
  const exporter = new GLTFExporter();
  exporter.parse(scene, (gltf) => {
    const blob = new Blob([JSON.stringify(gltf)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scene.glb";
    a.click();
    URL.revokeObjectURL(url);
  }, options);
}
