import * as THREE from 'three';

export class RadialGlowMaterial extends THREE.ShaderMaterial {
    constructor(parameters = {}) {
        super({
            uniforms: {
                color: { value: new THREE.Color(parameters.color || 0x00d1ff) },
                alpha: { value: parameters.alpha || 1.0 },
                power: { value: parameters.power || 2.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float alpha;
                uniform float power;
                varying vec2 vUv;

                void main() {
                    // Distance from center (0.5, 0.5)
                    float dist = distance(vUv, vec2(0.5));
                    
                    // Invert distance so center is 1.0 and edges are 0.0
                    float glow = 1.0 - (dist * 2.0);
                    glow = clamp(glow, 0.0, 1.0);
                    glow = pow(glow, power);
                    
                    gl_FragColor = vec4(color, glow * alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
    }
}
