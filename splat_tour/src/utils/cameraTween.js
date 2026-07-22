// Petit utilitaire de transition caméra, sans dépendance externe (pas besoin de GSAP).
// Anime la position de la caméra et le point regardé (target des OrbitControls)
// entre leur état actuel et une destination, avec un easing "ease-in-out".

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * @param {THREE.Camera} camera
 * @param {THREE.Vector3} controlsTarget - la propriété `.target` des OrbitControls
 * @param {[number, number, number]} toPosition
 * @param {[number, number, number]} toTarget
 * @param {number} duration - en millisecondes
 * @param {() => void} [onComplete]
 * @returns {() => void} une fonction "cancel" pour interrompre l'animation
 */
export function animateCameraTo(
  camera,
  controlsTarget,
  toPosition,
  toTarget,
  duration = 1200,
  onComplete,
) {
  const startPosition = camera.position.clone();
  const startTarget = controlsTarget.clone();
  const endPosition = new camera.position.constructor(...toPosition);
  const endTarget = new controlsTarget.constructor(...toTarget);

  let rafId = null;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(t);

    camera.position.lerpVectors(startPosition, endPosition, eased);
    controlsTarget.lerpVectors(startTarget, endTarget, eased);

    if (t < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      onComplete?.();
    }
  }

  rafId = requestAnimationFrame(step);

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}
