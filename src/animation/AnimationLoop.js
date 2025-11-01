export function startAnimationLoop(renderer, scene, camera, update) {
  function animate() {
    requestAnimationFrame(animate);
    if (update) update();
    renderer.render(scene, camera);
  }
  animate();
}
