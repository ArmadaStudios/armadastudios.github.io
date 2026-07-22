import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import { animateCameraTo } from "../utils/cameraTween";

/**
 * Props:
 * - splatUrl: string — chemin vers ton fichier .sog / .ply / .spz
 * - hotspots: tableau d'objets (voir src/data/hotspots.js)
 * - onSelectHotspot: callback(hotspot | null) — appelé quand un hotspot est
 *   sélectionné ou désélectionné, pour piloter le panneau de légende côté App
 */
export default function SplatViewer({ splatUrl, hotspots, onSelectHotspot }) {
  const containerRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const cancelTweenRef = useRef(null);

  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  // Positions écran (px) des hotspots, recalculées à chaque frame
  const [screenPositions, setScreenPositions] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    // --- Scène / caméra / renderer -----------------------------------
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.01,
      1000,
    );
    // NB: ce cadrage par défaut correspond au splat de démo utilisé dans
    // App.jsx. Avec ta propre scène, ajuste ces valeurs (ou celles du
    // premier hotspot) pour démarrer face à ton point d'entrée.
    camera.position.set(9, 3, 9);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    // Cap le pixel ratio : gros gain de perf sur mobile (écrans très denses)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Spark s'accroche à la scène comme un objet normal
    const spark = new SparkRenderer({ renderer });
    scene.add(spark);

    // --- Contrôles (pan/zoom/orbit tactile + souris) ------------------
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 3, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.3;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    // --- Chargement du splat ------------------------------------------
    // SplatMesh n'expose pas de callback onError direct : on vérifie
    // d'abord que le fichier est accessible pour donner un message clair
    // en cas de mauvais chemin (erreur fréquente au premier essai).
    let splatMesh = null;
    fetch(splatUrl, { method: "HEAD" })
      .then((res) => {
        if (disposed) return;
        if (!res.ok) {
          setError(
            `Impossible de charger "${splatUrl}" (HTTP ${res.status}). Vérifie le chemin du fichier dans public/.`,
          );
          return;
        }
        splatMesh = new SplatMesh({
          url: splatUrl,
          raycastable: true, // nécessaire si tu veux un jour cliquer directement sur le splat
          onProgress: (event) => {
            if (event.lengthComputable) {
              setLoadProgress(Math.round((event.loaded / event.total) * 100));
            }
          },
          onLoad: () => {
            if (!disposed) setIsLoaded(true);
          },
        });
        splatMesh.rotation.set(Math.PI, 0, 0);
        scene.add(splatMesh);
      })
      .catch(() => {
        if (!disposed) {
          setError(
            `Impossible de charger "${splatUrl}". Vérifie le chemin du fichier et ta connexion.`,
          );
        }
      });

    // --- Boucle de rendu -------------------------------------------
    function animate() {
      if (disposed) return;
      controls.update();
      console.log(camera.position.toArray(), controls.target.toArray());
      renderer.render(scene, camera);
      updateScreenPositions();
      requestAnimationFrame(animate);
    }

    // Projette chaque hotspot 3D vers des coordonnées écran (px) pour
    // positionner les marqueurs HTML par-dessus le canvas.
    const projected = new THREE.Vector3();
    function updateScreenPositions() {
      const rect = container.getBoundingClientRect();
      const next = {};
      for (const h of hotspots) {
        projected.set(...h.position).project(camera);
        const behindCamera = projected.z > 1;
        next[h.id] = {
          x: (projected.x * 0.5 + 0.5) * rect.width,
          y: (-projected.y * 0.5 + 0.5) * rect.height,
          visible: !behindCamera,
        };
      }
      setScreenPositions(next);
    }

    function handleResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    animate();

    return () => {
      disposed = true;
      window.removeEventListener("resize", handleResize);
      cancelTweenRef.current?.();
      controls.dispose();
      splatMesh?.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splatUrl]);

  function handleHotspotClick(hotspot) {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const nextSelected = selectedId === hotspot.id ? null : hotspot.id;
    setSelectedId(nextSelected);
    onSelectHotspot?.(nextSelected ? hotspot : null);

    if (!nextSelected) return;

    cancelTweenRef.current?.();
    const toPosition = hotspot.cameraPosition ?? hotspot.position;
    const toTarget = hotspot.cameraTarget ?? hotspot.position;
    cancelTweenRef.current = animateCameraTo(
      camera,
      controls.target,
      toPosition,
      toTarget,
      1200,
    );
  }

  return (
    <div className="viewer-root">
      <div ref={containerRef} className="viewer-canvas-container" />

      {!isLoaded && !error && (
        <div className="viewer-loading">
          <div className="viewer-loading-bar">
            <div
              className="viewer-loading-fill"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <span>Chargement de la scène… {loadProgress}%</span>
        </div>
      )}

      {error && <div className="viewer-error">{error}</div>}

      <div className="hotspot-layer">
        {hotspots.map((h) => {
          const pos = screenPositions[h.id];
          if (!pos || !pos.visible) return null;
          return (
            <button
              key={h.id}
              className={
                "hotspot-marker" + (selectedId === h.id ? " is-active" : "")
              }
              style={{ left: pos.x, top: pos.y }}
              onClick={() => handleHotspotClick(h)}
              aria-label={h.label}
            >
              <span className="hotspot-dot" />
              <span className="hotspot-label">{h.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
