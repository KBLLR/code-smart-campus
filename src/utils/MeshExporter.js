// src/utils/MeshExporter.js
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

// Helper function to trigger file download
function save(blob, filename) {
  const link = document.createElement("a");
  link.style.display = "none";
  document.body.appendChild(link); // Required for Firefox
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href); // Free up memory
  link.remove();
}

function saveString(text, filename) {
  save(new Blob([text], { type: "text/plain" }), filename);
}

function saveArrayBuffer(buffer, filename) {
  save(new Blob([buffer], { type: "application/octet-stream" }), filename);
}

export class MeshExporter {
  constructor() {
    this.gltfExporter = new GLTFExporter();
    this.stlExporter = new STLExporter();
    console.log("[MeshExporter] Initialized.");
  }

  /**
   * Exports a given Three.js object (Scene, Group, Mesh) as a GLTF/GLB file.
   * @param {THREE.Object3D} objectToExport - The object to export.
   * @param {string} filename - Desired filename (e.g., 'scene.glb').
   * @param {boolean} [binary=true] - Export as binary GLB (true) or JSON GLTF (false).
   */
  exportGLTF(objectToExport, filename = "scene.gltf", binary = true) {
    if (!objectToExport) {
      console.error("[MeshExporter] No object provided for GLTF export.");
      alert("Error: No object selected for export.");
      return;
    }
    console.log(
      `[MeshExporter] Exporting ${objectToExport.name || "object"} as GLTF (Binary: ${binary})...`,
    );

    const options = {
      trs: false, // Whether to include position, rotation, scale (usually true)
      onlyVisible: true, // Export only visible objects
      binary: binary, // Export as GLB
      maxDecimals: 2, // Optional: reduce precision
      // includeCustomExtensions: true // If you have custom extensions
    };

    this.gltfExporter.parse(
      objectToExport,
      (result) => {
        if (result instanceof ArrayBuffer) {
          saveArrayBuffer(result, filename.replace(/\.gltf$/, ".glb")); // Ensure .glb extension for binary
        } else {
          const output = JSON.stringify(result, null, 2);
          saveString(output, filename.replace(/\.glb$/, ".gltf")); // Ensure .gltf extension for JSON
        }
        console.log(`[MeshExporter] GLTF export successful: ${filename}`);
        alert(`Exported ${filename} successfully!`);
      },
      (error) => {
        console.error("[MeshExporter] GLTF Export Error:", error);
        alert(`Error exporting GLTF: ${error}`);
      },
      options,
    );
  }

  /**
   * Exports a given Three.js object (Scene, Group, Mesh) as an STL file.
   * Note: STL is unitless and doesn't support materials/colors. Best for single meshes or merged geometry.
   * @param {THREE.Object3D} objectToExport - The object to export.
   * @param {string} filename - Desired filename (e.g., 'mesh.stl').
   * @param {boolean} [binary=true] - Export as binary STL (true) or ASCII STL (false).
   */
  exportSTL(objectToExport, filename = "mesh.stl", binary = true) {
    if (!objectToExport) {
      console.error("[MeshExporter] No object provided for STL export.");
      alert("Error: No object selected for export.");
      return;
    }
    console.log(
      `[MeshExporter] Exporting ${objectToExport.name || "object"} as STL (Binary: ${binary})...`,
    );

    const options = { binary: binary };
    const result = this.stlExporter.parse(objectToExport, options);

    if (binary && result instanceof DataView) {
      // Binary parse returns DataView
      saveArrayBuffer(result.buffer, filename); // Save the underlying ArrayBuffer
    } else if (!binary && typeof result === "string") {
      // ASCII parse returns string
      saveString(result, filename);
    } else {
      console.error(
        "[MeshExporter] STL Export Error: Unexpected result type.",
        result,
      );
      alert("Error exporting STL: Unexpected result.");
      return;
    }

    console.log(`[MeshExporter] STL export successful: ${filename}`);
    alert(`Exported ${filename} successfully!`);
  }
}
