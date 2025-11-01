export class LabelLayoutManager {
  constructor(scene, labels, roomRegistry) {
    this.scene = scene;
    this.labels = labels;
    this.roomRegistry = roomRegistry;
    this.mode = "svg-aligned";
  }

  setMode(mode) {
    this.mode = mode;
    this.applyLayout();
  }

  applyLayout() {
    switch (this.mode) {
      case "clustered":
        this.layoutClustered();
        break;
      case "random":
      case "float":
        this.layoutRandom();
        break;
      case "grid":
      case "type-grid":
        this.layoutGrid();
        break;
      case "radial":
        this.layoutRadial();
        break;
      case "spiral":
        this.layoutSpiral();
        break;
      case "heatmap":
        this.layoutHeatmap();
        break;
      case "manual":
        this.layoutManual();
        break;
      case "svg-aligned":
        this.layoutSvgAligned();
        break;
      default:
        console.warn(`Unknown layout mode: ${this.mode}`);
    }
  }

  layoutClustered() {
    for (const [id, label] of Object.entries(this.labels)) {
      const roomKey = label.userData?.room;
      const room = this.roomRegistry[roomKey?.toLowerCase()];
      if (room) {
        const offsetX = Math.random() * 40 - 20;
        const offsetZ = Math.random() * 40 - 20;
        label.position.set(
          room.center[0] + offsetX,
          20,
          room.center[2] + offsetZ,
        );
      }
    }
  }

  layoutRandom() {
    for (const label of Object.values(this.labels)) {
      label.position.set(
        Math.random() * 800 - 400,
        20,
        Math.random() * 800 - 400,
      );
    }
  }

  layoutGrid() {
    const spacing = 60;
    let i = 0;
    for (const label of Object.values(this.labels)) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      label.position.set(col * spacing - 300, 20, row * spacing - 300);
      i++;
    }
  }

  layoutRadial() {
    const radius = 300;
    const entries = Object.entries(this.labels);
    entries.forEach(([id, label], i) => {
      const angle = (i / entries.length) * Math.PI * 2;
      label.position.set(
        Math.cos(angle) * radius,
        20,
        Math.sin(angle) * radius,
      );
    });
  }

  layoutSpiral() {
    const spacing = 15;
    const angleStep = 0.3;
    Object.entries(this.labels).forEach(([id, label], i) => {
      const angle = i * angleStep;
      const radius = spacing * angle;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 20 + i * 0.5;
      label.position.set(x, y, z);
    });
  }

  layoutHeatmap() {
    const spacing = 80;
    let i = 0;
    for (const label of Object.values(this.labels)) {
      const intensity = label.userData?.intensity || Math.random();
      const row = Math.floor(i / 10);
      const col = i % 10;
      label.position.set(
        col * spacing - 300,
        20 + intensity * 50,
        row * spacing - 300,
      );
      i++;
    }
  }

  layoutManual() {
    for (const [id, label] of Object.entries(this.labels)) {
      const pos = label.userData?.registry?.position;
      if (pos) label.position.set(...pos);
    }
  }

  layoutSvgAligned() {
    for (const [id, label] of Object.entries(this.labels)) {
      const pos = label.userData?.originalPosition || [0, 20, 0];
      label.position.set(...pos);
    }
  }

  toggleGroupVisibility(group, visible) {
    Object.values(this.labels).forEach((label) => {
      const type = label.userData?.registry?.type;
      if (type === group) label.visible = visible;
    });
  }

  async reinjectLabels(newRegistry) {
    // Remove old labels from scene
    Object.values(this.labels).forEach((label) => {
      this.scene.remove(label);
    });

    // Clear old label objects
    for (const key in this.labels) {
      delete this.labels[key];
    }

    // Create and add new labels
    const { createLabel } = await import("@/ui/createLabel.js");

    for (const [entityId, entry] of Object.entries(newRegistry)) {
      const roomKey = entry.room?.toLowerCase();
      const room = this.roomRegistry[roomKey];
      if (!room?.center) {
        console.warn(`[Labels] Skipped ${entityId} – no room center`);
        continue;
      }

      const label = createLabel(entry.label, true, entityId);
      label.position.set(...room.center);
      label.userData.registry = entry;
      label.userData.room = roomKey;
      label.userData.intensity = 0;
      label.userData.originalPosition = [...room.center];

      this.labels[entityId] = label;
      this.scene.add(label);
    }

    console.log(`🔁 Re-injected ${Object.keys(this.labels).length} labels.`);
    this.applyLayout(); // reapply current layout
  }
}
