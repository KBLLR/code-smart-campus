// src/ui/components/organisms/Toolbar.js
import { Button } from "@atoms/Button.js";
import { Toggle } from "@atoms/Toggle.js";
import Setup from "@/Setup.js";
import { getIconForEntity } from "@utils/entityUtils.js";
import { MeshExporter } from "@utils/MeshExporter.js"; // Import the exporter

let btn;

export class Toolbar {
  // --- MODIFICATION: Accept scene and exportTarget (roundedRoomsGroup) ---
  constructor({
    onToggleGroup,
    initialLabels,
    setupInstance,
    scene,
    exportTarget,
  }) {
    console.log("[Toolbar Constructor] STARTING...");

    // Find the main toolbar container from HTML
    this.container = document.querySelector(".toolbar");
    if (!this.container) {
      console.error("❌ Toolbar Init Failed: Element .toolbar NOT FOUND!");
      return;
    }
    console.log("[Toolbar Constructor] Found container:", this.container);
    this.container.classList.add("toolbar__container", "theme-scifi-glass");

    // Store dependencies
    this.onToggleGroup =
      typeof onToggleGroup === "function" ? onToggleGroup : () => {};
    this.labels = initialLabels || {};
    this.setupInstance = setupInstance; // Use the provided instance
    this.scene = scene; // Use the provided scene instance
    this.canvas = scene.cnvs;
    this.exportTarget = exportTarget; // The object to export (e.g., roundedRoomsGroup)
    this.exporter = new MeshExporter(); // Instantiate the exporter utility

    // Validate essential dependencies needed later
    if (!this.setupInstance || typeof this.setupInstance.setCameraView !== "function") {
      console.warn(
        "Toolbar: setupInstance invalid/missing setCameraView. View controls disabled.",
      );
      this.setupInstance = null;
    }
    if (!this.exportTarget) {
      console.warn(
        "Toolbar: exportTarget (e.g., roundedRoomsGroup) not provided. Export buttons disabled.",
      );
    }

    // Populate the pre-defined group containers
    try {
      console.log("[Toolbar Constructor] Populating groups...");
      this.createLayoutGroup(); // <= RENAME CALL
      this.createDataLayerGroup(); // <= RENAME CALL
      this.createViewControlGroup(); // <= RENAME CALL
      this.createAnalysisGroup(); // <= RENAME CALL
      this.createIOGroup(); // <= RENAME CALL (also rename method def below) // Populate the new IO group
      console.log("[Toolbar Constructor] Finished populating groups.");
    } catch (error) {
      console.error("Toolbar: Failed during population of elements.", error);
      if (this.container)
        this.container.innerHTML =
          '<p style="color: red;">Error loading toolbar content</p>';
    }
    console.log("[Toolbar Constructor] FINISHED.");
  }

  // --- NOTE: Separator element is now expected to be hardcoded in index.html ---
  // separator() { /* ... Removed ... */ }

  // --- MODIFICATION: Populate methods find container and add buttons ---

  createLayoutGroup() {
    const groupContainer = this.container.querySelector(
      ".toolbar__group--data-layers",
    );
    if (!groupContainer) {
      console.error("Toolbar: Data Layers group container not found.");
      return null;
    } // Return null on error
    groupContainer.innerHTML = ""; // Clear placeholders

    // --- Toggle All Labels Button ---
    try {
      // ... (Toggle All button creation logic - append to groupContainer) ...
    } catch (error) {
      console.error("Toolbar: Failed 'Toggle All Labels' btn.", error);
    }

    // Separator
    if (groupContainer.childElementCount > 0) {
      const smallSep = document.createElement("div");
      smallSep.style.cssText =
        "width: 1px; height: 20px; background: rgba(255, 255, 255, 0.2); margin: 0 4px;";
      groupContainer.appendChild(smallSep);
    }

    // --- Individual Layer Toggles ---
    const types = [
      "calendar",
      "temperature",
      "occupancy",
      "humidity",
      "air",
      "light",
      "sun",
    ];
    types.forEach((type) => {
      try {
        const iconName = getIconForEntity(type);
        btn = document.createElement("button"); // <<-- Button element is named 'btn'
        btn.classList.add(
          "toolbar__button",
          "toolbar__button--toggle",
          "active",
        );
        btn.type = "button";
        const img = document.createElement("img");
        img.src = `/icons/${iconName}.svg`;
        img.width = 20;
        img.height = 20;
        img.alt = "";
        img.classList.add("toolbar__button-icon");
        img.style.pointerEvents = "none";
        btn.title = `Toggle ${type} layer`;
        btn.appendChild(img);
        btn.dataset.labelType = type;

        // --- FIX: Use 'btn' variable inside the handler ---
        btn.onclick = () => {
          const active = btn.classList.toggle("active"); // Use 'btn' here
          this.onToggleGroup(type, active);
        };
        // --- END FIX ---

        groupContainer.appendChild(btn);
      } catch (error) {
        console.error(`Toolbar: Failed toggle btn '${type}'.`, error);
      }
    });
    // Return null if nothing was added (e.g., if Toggle All failed and types array was empty)
    return groupContainer.childElementCount > 0 ? groupContainer : null;
  }

  createDataLayerGroup() {
    const groupContainer = this.container.querySelector(
      ".toolbar__group--data-layers",
    );
    if (!groupContainer) {
      console.error("Toolbar: Data Layers group container not found.");
      return;
    }
    groupContainer.innerHTML = "";

    // Toggle All Button
    try {
      /* ... create and append Toggle All button to groupContainer ... */
    } catch (error) {
      console.error("Toolbar: Failed 'Toggle All Labels' btn.", error);
    }

    // Separator (if needed visually within the group) - Consider CSS :not(:first-child) margin instead
    if (groupContainer.childElementCount > 0) {
      const sep = document.createElement("div");
      sep.style.cssText =
        "width:1px; height:20px; background:rgba(255,255,255,0.1); margin: 0 4px;";
      groupContainer.appendChild(sep);
    }

    // Individual Toggles
    const types = ["calendar", "temperature" /* ... other types ... */];
    types.forEach((type) => {
      try {
        const iconName = getIconForEntity(type);
        // ... create individual toggle button (btn) ...
        btn.onclick = () => {
          const active = btn.classList.toggle("active");
          this.onToggleGroup(type, active);
        };
        groupContainer.appendChild(btn);
      } catch (error) {
        console.error(`Toolbar: Failed toggle btn '${type}'.`, error);
      }
    });
  }

  createViewControlGroup() {
    if (!this.setup) return; // Requires setup instance
    const groupContainer = this.container.querySelector(
      ".toolbar__group--view-controls",
    );
    if (!groupContainer) {
      console.error("Toolbar: View Controls group container not found.");
      return;
    }
    groupContainer.innerHTML = "";

    const views = [
      /* ... views definitions ... */
    ];
    views.forEach(({ view, icon, title }) => {
      try {
        const btn = Button({
          icon,
          onClick: () => this.setup.setCameraView(view),
        });
        if (!(btn instanceof Node)) return;
        btn.classList?.add("toolbar__button", "toolbar__button--view");
        btn.title = title;
        groupContainer.appendChild(btn);
      } catch (error) {
        console.error(`Toolbar: Failed view btn '${view}'.`, error);
      }
    });
  }

  createAnalysisGroup() {
    const groupContainer = this.container.querySelector(
      ".toolbar__group--analysis",
    );
    if (!groupContainer) {
      console.error("Toolbar: Analysis group container not found.");
      return;
    }
    groupContainer.innerHTML = "";

    const tools = [
      /* ... tools definitions ... */
    ];
    tools.forEach(({ id, icon, title, action }) => {
      try {
        const btn = Button({ icon, onClick: action });
        if (!(btn instanceof Node)) return;
        btn.classList?.add("toolbar__button", "toolbar__button--analysis");
        btn.title = title;
        groupContainer.appendChild(btn);
      } catch (error) {
        console.error(`Toolbar: Failed analysis btn '${id}'.`, error);
      }
    });
  }

  // --- NEW: Populate Import/Export Group ---
  createIOGroup() {
    const groupContainer = this.container.querySelector(".toolbar__group--io");
    if (!groupContainer) {
      console.error("Toolbar: IO group container not found.");
      return;
    }
    groupContainer.innerHTML = "";

    const ioActions = [
      {
        id: "export-gltf",
        icon: "badge-3d.svg",
        title: "Export GLTF/GLB",
        action: () => {
          if (this.exportTarget)
            this.exporter.exportGLTF(
              this.exportTarget,
              "scene-export.gltf",
              true,
            );
          else alert("No object target defined for export.");
        },
      },
      {
        id: "export-stl",
        icon: "view-360-number.svg",
        title: "Export STL",
        action: () => {
          // Assuming you have a similar icon
          if (this.exportTarget)
            this.exporter.exportSTL(
              this.exportTarget,
              "scene-export.stl",
              true,
            );
          else alert("No object target defined for export.");
        },
      },
      // { id: 'import-gltf', icon: 'upload.svg', title: 'Import GLTF (NYI)', action: () => alert("Import NYI") },
    ];

    ioActions.forEach(({ id, icon, title, action }) => {
      try {
        const btn = Button({ icon, onClick: action });
        if (!(btn instanceof Node)) throw new Error("Button failed");
        btn.classList?.add("toolbar__button", "toolbar__button--io");
        btn.title = title;
        groupContainer.appendChild(btn);
      } catch (error) {
        console.error(`Toolbar: Failed IO btn '${id}'.`, error);
      }
    });
  }

  dispose() {
    // Clear content instead of removing container
    if (this.container) {
      // Optionally remove only dynamically added children if placeholders exist
      this.container
        .querySelectorAll(".toolbar__group")
        .forEach((group) => (group.innerHTML = ""));
    }
    console.log("Toolbar disposed (content cleared).");
  }
}

// --- END OF FILE Toolbar.js (Refactored for HTML Structure & IO) ---
