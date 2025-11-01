import { particleColor, world } from "../mainAAA";
import { meshColor } from "../mainAAA";
import { edgeColor1, edgeColor2 } from "./Uniforms";
import { genMesh, phyMat, particleMesh } from "../mainAAA";
import { dissolveUniformData } from "./Uniforms";
import { particleUniforms } from "@/main";
import { BladeApi } from "tweakpane";
import { BindingApi } from "@tweakpane/core";
import { updateGenMeshGeo, updateParticleSystem } from "../mainAAA";
import { setAutoProgress } from "../mainAAA";
import {
  torusKnotGeo,
  sphereGeo,
  torusGeo,
  boxGeo,
  teapotGeo,
} from "./geometries";
import { shaderPass } from "./BloomComposer";

function createTweakList(name: string, keys: string[], vals: any[]): BladeApi {
  const opts = [];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const v = vals[i];
    opts.push({ text: k, value: v });
  }

  return world.pane.addBlade({
    view: "list",
    label: name,
    options: opts,
    value: vals[0],
  });
}

function handleMeshColorUpdate(color: string) {
  meshColor.setColor(color);
  phyMat.color = meshColor.rgb;
}

function handleEdge1ColorUpdate(color: string) {
  edgeColor1.setColor(color);
  dissolveUniformData.uEdgeColor1.value = edgeColor1.vec3;
}

function handleParticleColorUpdate(color: string) {
  particleColor.setColor(color);
  particleUniforms.uColor.value = particleColor.vec3;
}

export function handleMeshChange(geo: any) {
  world.scene.remove(genMesh);
  updateGenMeshGeo(geo);
  world.scene.add(genMesh);

  world.scene.remove(particleMesh);
  updateParticleSystem(geo);
  world.scene.add(particleMesh);
}

export let speedBinding: BindingApi;
export let autoProgressBinding: BindingApi;

export function updateAnimationTweaks(autoAnimate: boolean) {
  if (autoAnimate) {
    speedBinding.disabled = false;
    progressBinding.disabled = true;
  } else {
    speedBinding.disabled = true;
    progressBinding.disabled = false;
    //progressBinding.controller.value.rawValue = -12;
  }
}

export let meshBlade: BladeApi;
export const meshArr = [teapotGeo, torusKnotGeo, torusGeo, boxGeo, sphereGeo];
export const keyArr = ["Tea Pot", "Torus Knot", "Torus", "Box", "Sphere"];
export const TWEAKS: { [key: string]: any } = {};
export let progressBinding: BindingApi;
export function setupTweaks() {
  TWEAKS.meshColor = meshColor.hexString;
  TWEAKS.edgeColor = edgeColor1.hexString;
  TWEAKS.edgeColor2 = edgeColor2.hexString;
  TWEAKS.particleColor = particleColor.hexString;
  TWEAKS.object = genMesh;
  TWEAKS.freq = dissolveUniformData.uFreq.value;
  TWEAKS.amp = dissolveUniformData.uAmp.value;
  TWEAKS.progress = dissolveUniformData.uProgress.value;
  TWEAKS.edge = dissolveUniformData.uEdge.value;
  TWEAKS.autoprogress = false;
  TWEAKS.bloomStrength = 12.0;
  TWEAKS.speed = 1.5;

  meshBlade = createTweakList("Mesh", keyArr, meshArr);
  let colorFolder = world.pane.addFolder({ title: "Color" });
  let effectFolder = world.pane.addFolder({ title: "Dissolve Effect" });
  let animation = world.pane.addFolder({ title: "Animation" });
  let BloomFolder = world.pane.addFolder({ title: "Bloom Effect" });

  const meshColorBinding = colorFolder.addBinding(TWEAKS, "meshColor", {
    label: "Mesh",
  });
  const edge1ColorBinding = colorFolder.addBinding(TWEAKS, "edgeColor", {
    label: "Edge",
  });
  //const edge2ColorBinding = world.pane.addBinding(TWEAKS, "edgeColor2")
  const particleColorBinding = colorFolder.addBinding(TWEAKS, "particleColor", {
    label: "Particle",
  });
  const frequencyBinding = effectFolder.addBinding(TWEAKS, "freq", {
    min: 0,
    max: 5,
    step: 0.001,
  });
  //const amplitudeBinding = world.pane.addBinding(TWEAKS, "amp", { min: 12, max: 25, step: 0.001 })
  autoProgressBinding = animation.addBinding(TWEAKS, "autoprogress", {
    label: "Auto",
  });

  progressBinding = animation.addBinding(TWEAKS, "progress", {
    min: -20,
    max: 20,
    step: 0.001,
    label: "Progress",
  });
  const edgeBinding = effectFolder.addBinding(TWEAKS, "edge", {
    min: 0,
    max: 5,
    step: 0.0001,
  });
  const bloomStrengthBinding = BloomFolder.addBinding(TWEAKS, "bloomStrength", {
    min: 0,
    max: 20,
    step: 0.01,
    label: "Strength",
  });
  speedBinding = animation.addBinding(TWEAKS, "speed", {
    min: 0.15,
    max: 3,
    step: 0.001,
    label: "Speed",
    disabled: true,
  });

  //@ts-ignore
  meshBlade.on("change", (val) => {
    handleMeshChange(val.value);
  });
  meshColorBinding.on("change", (val) => {
    handleMeshColorUpdate(val.value);
  });
  edge1ColorBinding.on("change", (val) => {
    handleEdge1ColorUpdate(val.value);
  });
  //edge2ColorBinding.on('change', (val) => { handleEdge2ColorUpdate(val.value) });
  particleColorBinding.on("change", (val) => {
    handleParticleColorUpdate(val.value);
  });
  frequencyBinding.on("change", (val) => {
    dissolveUniformData.uFreq.value = val.value;
  });
  //amplitudeBinding.on('change', (val) => { dissolveUniformData.uAmp.value = val.value });
  progressBinding.on("change", (val) => {
    dissolveUniformData.uProgress.value = val.value as number;
  });
  edgeBinding.on("change", (val) => {
    dissolveUniformData.uEdge.value = val.value;
  });
  //@ts-ignore
  autoProgressBinding.on("change", (val) => {
    setAutoProgress(val.value);
    updateAnimationTweaks(val.value);
  });
  bloomStrengthBinding.on("change", (val) => {
    shaderPass.uniforms.uStrength.value = val.value;
  });
  speedBinding.on("change", (val) => {
    TWEAKS.speed = val.value;
  });
}
