import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

// After your SVG is extruded and added to the scene:
const exporter = new STLExporter();
const stlString = exporter.parse(this.group); // assuming this.group is your final object

// Download as .stl
const blob = new Blob([stlString], { type: "text/plain" });
const link = document.createElement("a");
link.style.display = "none";
document.body.appendChild(link);
link.href = URL.createObjectURL(blob);
link.download = "floorplan_model.stl";
link.click();
