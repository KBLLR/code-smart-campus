import * as THREE from 'three';

export class HologramMaterial extends THREE.ShaderMaterial {
    constructor(parameters = {}) {
        super({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(parameters.color || 0x00d1ff) },
                opacity: { value: parameters.opacity || 1.0 },
                rimColor: { value: new THREE.Color(parameters.rimColor || 0xffffff) },
                rimPower: { value: parameters.rimPower || 2.0 },
                scanlineScale: { value: parameters.scanlineScale || 50.0 },
                scanlineIntensity: { value: parameters.scanlineIntensity || 0.5 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewPosition = -mvPosition.xyz;
                    vUv = uv;
                    vElevation = position.y;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float opacity;
                uniform vec3 rimColor;
                uniform float rimPower;
                uniform float scanlineScale;
                uniform float scanlineIntensity;

                varying vec3 vNormal;
                varying vec3 vViewPosition;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(vViewPosition);
                    
                    // Rim lighting (Fresnel)
                    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
                    rim = pow(rim, rimPower);
                    
                    // Scanlines
                    float scanline = sin((vElevation * 0.5 + time * 0.2) * scanlineScale) * 0.5 + 0.5;
                    scanline = mix(1.0, scanline, scanlineIntensity);
                    
                    // Combine
                    vec3 finalColor = color + rim * rimColor;
                    finalColor *= scanline;
                    
                    gl_FragColor = vec4(finalColor, opacity * (rim + 0.2));
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
    }
}
