import * as THREE from "three";
import { Setup } from "@/Setup";
import { EffectComposer, UnrealBloomPass } from "three/examples/jsm/Addons.js";
import { RenderPass } from "three/examples/jsm/Addons.js";
import { OutputPass } from "three/examples/jsm/Addons.js";
import { ShaderPass } from "three/examples/jsm/Addons.js";
import { TWEAKS } from "./tweaks";

const cnvs = document.getElementById("c") as HTMLCanvasElement;
const res = new THREE.Vector2(cnvs.clientWidth, cnvs.clientHeight);

let effectComposer: EffectComposer;
let effectComposer2: EffectComposer;

let renderPass: RenderPass;
let bloomPass: UnrealBloomPass;
let outPass: OutputPass;
export let shaderPass: ShaderPass;

export function setupBloomComposer(world: Setup): {
  composer1: EffectComposer;
  composer2: EffectComposer;
} {
  effectComposer = new EffectComposer(world.re);
  effectComposer2 = new EffectComposer(world.re);
  renderPass = new RenderPass(world.scene, world.cam);

  bloomPass = new UnrealBloomPass(res, 0.5, 0.4, 0.2);
  outPass = new OutputPass();

  // use when there are multiple objects
  const layer1 = new THREE.Layers();
  layer1.set(1);

  effectComposer.addPass(renderPass);
  effectComposer.addPass(bloomPass);

  effectComposer.renderToScreen = false;

  shaderPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null }, // effect Composer will set this value it'll pass the base textre from previous pass
        uBloomTexture: {
          value: effectComposer.renderTarget2.texture,
        },
        uStrength: {
          value: TWEAKS.bloomStrength || 12.01,
        },
      },

      vertexShader: `
        varying vec2 vUv;
        void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
    `,

      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D uBloomTexture;
        uniform float uStrength;
        varying vec2 vUv;
        void main(){
            vec4 baseEffect = texture2D(tDiffuse,vUv);
            vec4 bloomEffect = texture2D(uBloomTexture,vUv);
            gl_FragColor =baseEffect + bloomEffect * uStrength;
        }
    `,
    }),
  );

  effectComposer2.addPass(renderPass);
  effectComposer2.addPass(shaderPass);
  effectComposer2.addPass(outPass);

  return {
    composer1: effectComposer,
    composer2: effectComposer2,
  };
}

export function resizeBloomComposer() {
  const w = cnvs.clientWidth;
  const h = cnvs.clientHeight;

  renderPass.setSize(w, h);
  bloomPass.setSize(w, h);
  shaderPass.setSize(w, h);
  outPass.setSize(w, h);

  effectComposer.setSize(w, h);
  effectComposer2.setSize(w, h);
}
