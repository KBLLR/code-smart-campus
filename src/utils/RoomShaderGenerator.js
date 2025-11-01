import * as THREE from "three";

export class RoomShaderGenerator {
  constructor(dataMap = {}) {
    this.dataMap = dataMap;
    this.defaultColor = new THREE.Color(0x888888); // Default grey
    this.coldColor = new THREE.Color(0x60a5fa); // Blueish
    this.warmColor = new THREE.Color(0xfbbf24); // Amber
    this.hotColor = new THREE.Color(0xf87171); // Reddish
  }

  // Helper to parse temperature string (e.g., "23.1 °C") into a number
  parseTemperature(tempString) {
    if (typeof tempString !== "string") return null;
    const match = tempString.match(/(-?\d+(\.\d+)?)/); // Extract number
    return match ? parseFloat(match[1]) : null;
  }

  // Calculate color based on temperature
  getColorForTemperature(temperature) {
    if (temperature === null || isNaN(temperature)) {
      return this.defaultColor;
    }
    // Define temperature thresholds
    const coldThreshold = 20;
    const warmThreshold = 25;
    const hotThreshold = 28; // Anything above this is 'hot'

    let color = new THREE.Color();

    if (temperature < coldThreshold) {
      // Interpolate towards coldColor as it gets colder than 'coldThreshold'
      const factor = THREE.MathUtils.smoothstep(temperature, 15, coldThreshold); // Range 15-20
      color.lerpColors(this.coldColor, this.defaultColor, factor);
    } else if (temperature < warmThreshold) {
      // Interpolate between default and warm as it approaches 'warmThreshold'
      const factor = THREE.MathUtils.smoothstep(
        temperature,
        coldThreshold,
        warmThreshold,
      ); // Range 20-25
      color.lerpColors(this.defaultColor, this.warmColor, factor);
    } else {
      // temperature >= warmThreshold
      // Interpolate between warm and hot as it gets hotter than 'warmThreshold'
      const factor = THREE.MathUtils.smoothstep(
        temperature,
        warmThreshold,
        hotThreshold,
      ); // Range 25-28+
      color.lerpColors(this.warmColor, this.hotColor, factor);
    }
    return color;
  }

  getMaterialForRoom(roomId) {
    const data = this.dataMap[roomId] || {};
    const text = this.formatRoomData(data);

    const canvas = this.createTextCanvas(text);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // Keep wrapping
    // texture.repeat.set(1, 1); // Adjust repeat if needed

    // Find temperature data
    let temperature = null;
    for (const key in data) {
      // Look for keys containing 'temperature' case-insensitively
      if (key.toLowerCase().includes("temperature")) {
        temperature = this.parseTemperature(data[key]);
        if (temperature !== null) break; // Use the first valid one found
      }
    }

    // Calculate base color based on temperature
    const baseColor = this.getColorForTemperature(temperature);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0.0 },
        uBaseColor: { value: baseColor }, // Add base color uniform
        uHover: { value: 0.0 }, // Add uniform for hover effect (0 or 1)
        uSelected: { value: 0.0 }, // Add uniform for selection effect (0 or 1)
      },
      vertexShader: this.vertexShader(),
      fragmentShader: this.fragmentShader(),
      transparent: true, // Keep transparency for text overlay potentially
      side: THREE.DoubleSide,
    });

    return material;
  }

  formatRoomData(data) {
    // Keep formatting as is for now
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${value}`)
      .join("  •  ");
  }

  createTextCanvas(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024; // Adjust size as needed
    canvas.height = 64; // Adjust size as needed
    const ctx = canvas.getContext("2d");

    // Background for better text visibility (optional)
    // ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    ctx.fillStyle = "#FFFFFF"; // White text
    ctx.font = "bold 24px Rajdhani"; // Font style
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // Draw text centered vertically
    ctx.fillText(text, 10, canvas.height / 2);

    return canvas;
  }

  vertexShader() {
    // Keep vertex shader simple
    return `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  fragmentShader() {
    // Modify fragment shader to use base color and texture
    return `
      uniform sampler2D uTexture;
      uniform float uTime;
      uniform vec3 uBaseColor; // Receive the base color
      uniform float uHover;     // Receive hover state
      uniform float uSelected;  // Receive selected state

      varying vec2 vUv;

      void main() {
        // Scroll the texture coordinates
        vec2 scrolledUv = vUv;
        scrolledUv.x = fract(scrolledUv.x + uTime * 0.03); // Use fract for seamless wrap

        // Sample the text texture
        vec4 texColor = texture2D(uTexture, scrolledUv);

        // Calculate effect intensity (highlight for hover/select)
        float effectIntensity = max(uHover * 0.3, uSelected * 0.5); // Hover adds less brightness than select
        vec3 finalColor = uBaseColor + effectIntensity; // Additive brightness effect

        // Combine base color with texture (multiply or overlay)
        // Option 1: Multiply base color by texture alpha (if text has alpha)
        // vec3 blendedColor = mix(finalColor, finalColor * texColor.rgb, texColor.a);
        // float finalAlpha = max(texColor.a, 0.1); // Ensure minimum visibility if base is dark?

        // Option 2: Additive blend - makes text glow more
        vec3 blendedColor = finalColor + texColor.rgb * texColor.a * 0.8; // Add text color weighted by its alpha
        float finalAlpha = 1.0; // Assume opaque unless text texture defines otherwise

        // Apply the result
        gl_FragColor = vec4(blendedColor, finalAlpha);

        // Simple alternative: Just show base color tinted by text alpha
        // gl_FragColor = vec4(uBaseColor, texColor.a);
      }
    `;
  }

  // Update method remains the same, just updates time
  update(material, time) {
    if (material.uniforms?.uTime) {
      material.uniforms.uTime.value = time;
    }
    // Note: uHover and uSelected should be updated based on interaction state elsewhere (e.g., in Scene.js update or interaction handlers)
  }
}
