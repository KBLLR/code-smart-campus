import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/Addons.js";
import { TeapotGeometry } from "three/examples/jsm/Addons.js";

export const planeGeo = new THREE.PlaneGeometry(8, 8, 100, 100);
export const boxGeo = new RoundedBoxGeometry(5, 5, 5, 24, 1);
export const sphereGeo = new THREE.SphereGeometry(4, 208, 208);
export const torusGeo = new THREE.TorusGeometry(3.0, 1.7, 150, 150);
export const teapotGeo = new TeapotGeometry(3, 32);
export const torusKnotGeo = new THREE.TorusKnotGeometry(2.5, 0.8, 200, 200);
export const coneGeo = new THREE.ConeGeometry(2, 4, 32);
export const cylinderGeo = new THREE.CylinderGeometry(2, 2, 4, 32);
export const dodecahedronGeo = new THREE.DodecahedronGeometry(4, 0);
export const octahedronGeo = new THREE.OctahedronGeometry(4, 0);
export const icosahedronGeo = new THREE.IcosahedronGeometry(4, 0);
export const tetrahedronGeo = new THREE.TetrahedronGeometry(4, 0);
