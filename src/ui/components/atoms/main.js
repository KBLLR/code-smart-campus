import * as THREE from 'three';

// Main initialization
document.addEventListener('DOMContentLoaded', () => {
  initCampusMap();
  initInteractions();
});

// Initialize interactions and event handlers
function initInteractions() {
  // Navigation highlight
  const navItems = document.querySelectorAll('.sidebar nav ul li');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Header buttons
  const headerButtons = document.querySelectorAll('.header-actions button');
  headerButtons.forEach(button => {
    button.addEventListener('click', () => {
      const buttonText = button.textContent;
      console.log(`${buttonText} button clicked`);
      
      // Example functionality
      if (buttonText === '3D Map') {
        toggleMapView('3d');
      } else if (buttonText === 'Room Insights') {
        showRoomInsights();
      } else if (buttonText === 'Tech Stack') {
        showTechStack();
      }
    });
  });
}

// Initialize the campus map using Three.js
function initCampusMap() {
  const mapContainer = document.getElementById('campus-map');
  
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);
  
  // Create camera
  const camera = new THREE.PerspectiveCamera(
    60,
    mapContainer.clientWidth / mapContainer.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 20, 30);
  camera.lookAt(0, 0, 0);
  
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(mapContainer.clientWidth, mapContainer.clientHeight);
  renderer.shadowMap.enabled = true;
  mapContainer.appendChild(renderer.domElement);
  
  // Add grid for reference
  const gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0xcccccc);
  scene.add(gridHelper);
  
  // Create floor/ground
  const floorGeometry = new THREE.PlaneGeometry(50, 50);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcccccc,
    roughness: 0.8,
    metalness: 0.2,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  
  // Add campus buildings
  createCampusBuildings(scene);
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Add directional light for shadows
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 15);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = mapContainer.clientWidth / mapContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(mapContainer.clientWidth, mapContainer.clientHeight);
  });
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
  
  // Add orbit controls
  enableOrbitControls(camera, renderer, scene);
}

// Create buildings on the campus map
function createCampusBuildings(scene) {
  // Create building outline shapes
  const buildingData = [
    { 
      name: 'Alexandria', 
      position: { x: 0, y: 0, z: 0 }, 
      dimensions: { width: 10, height: 3, depth: 10 },
      color: 0xdddddd
    },
    { 
      name: 'B Square', 
      position: { x: -12, y: 0, z: 5 }, 
      dimensions: { width: 8, height: 5, depth: 8 },
      color: 0xe0e0e0
    },
    { 
      name: 'Tetris', 
      position: { x: 12, y: 0, z: 8 }, 
      dimensions: { width: 6, height: 4, depth: 4 },
      color: 0xd5d5d5
    },
    { 
      name: 'Jungle', 
      position: { x: -10, y: 0, z: -10 }, 
      dimensions: { width: 7, height: 2, depth: 7 },
      color: 0xd8d8d8
    },
    { 
      name: 'Garden', 
      position: { x: 8, y: 0, z: -8 }, 
      dimensions: { width: 5, height: 1, depth: 5 },
      color: 0xe5e5e5
    }
  ];
  
  // Create buildings
  buildingData.forEach(building => {
    const geometry = new THREE.BoxGeometry(
      building.dimensions.width,
      building.dimensions.height,
      building.dimensions.depth
    );
    const material = new THREE.MeshStandardMaterial({ 
      color: building.color,
      roughness: 0.7,
      transparent: true,
      opacity: 0.85
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(
      building.position.x,
      building.dimensions.height / 2,
      building.position.z
    );
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Add building name as userData for later reference
    mesh.userData = { name: building.name };
    
    // Add click event to show building details
    mesh.callback = () => {
      showBuildingDetails(building.name);
    };
    
    scene.add(mesh);
  });
  
  // Add lines for interior room divisions (simplified)
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.5, transparent: true });
  
  // Add some interior lines to Alexandria building
  const alexandriaInteriorPoints = [
    new THREE.Vector3(-3, 0.1, -3),
    new THREE.Vector3(-3, 0.1, 3),
    new THREE.Vector3(3, 0.1, 3),
    new THREE.Vector3(3, 0.1, -3),
    new THREE.Vector3(-3, 0.1, -3),
  ];
  
  const alexandriaInteriorGeometry = new THREE.BufferGeometry().setFromPoints(alexandriaInteriorPoints);
  const alexandriaInteriorLine = new THREE.Line(alexandriaInteriorGeometry, lineMaterial);
  scene.add(alexandriaInteriorLine);
}

// Enable orbit controls for camera movement
function enableOrbitControls(camera, renderer, scene) {
  // This is a simplified version without importing the OrbitControls library
  // In a real project, you would import and use OrbitControls from three.js
  
  let isMouseDown = false;
  let previousMousePosition = { x: 0, y: 0 };
  const element = renderer.domElement;
  
  element.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    previousMousePosition = {
      x: e.clientX,
      y: e.clientY
    };
  });
  
  element.addEventListener('mouseup', () => {
    isMouseDown = false;
  });
  
  element.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    
    const deltaMove = {
      x: e.clientX - previousMousePosition.x,
      y: e.clientY - previousMousePosition.y
    };
    
    // Rotate camera (simplified)
    const deltaRotationQuaternion = new THREE.Quaternion()
      .setFromEuler(
        new THREE.Euler(
          deltaMove.y * 0.01,
          deltaMove.x * 0.01,
          0,
          'XYZ'
        )
      );
    
    camera.quaternion.multiplyQuaternions(deltaRotationQuaternion, camera.quaternion);
    
    previousMousePosition = {
      x: e.clientX,
      y: e.clientY
    };
  });
  
  // Add zoom with scroll wheel
  element.addEventListener('wheel', (e) => {
    const zoomSpeed = 0.1;
    if (e.deltaY > 0) {
      camera.position.z += zoomSpeed * 5;
    } else {
      camera.position.z -= zoomSpeed * 5;
    }
  });
  
  // Ray casting for clicking on buildings
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  element.addEventListener('click', (event) => {
    // Calculate mouse position in normalized device coordinates
    const rect = element.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Set raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections
    const intersects = raycaster.intersectObjects(scene.children);
    
    if (intersects.length > 0) {
      // Check if the clicked object has callback
      const selectedObject