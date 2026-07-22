import { useState } from "react";
import SplatViewer from "./components/SplatViewer";
import { hotspots } from "./data/hotspots";
import "./styles.css";

// Cette URL pointe vers un splat de démo public (pour que le projet
// fonctionne dès `npm run dev`, sans rien à configurer).
//
// POUR UTILISER TON PROPRE SCAN :
// 1. Convertis ton .ply en .sog (bien plus léger, voir README.md)
// 2. Place le fichier dans public/scenes/ (ex: public/scenes/mon-scan.sog)
// 3. Remplace la ligne ci-dessous par :
//    const SPLAT_URL = "/scenes/mon-scan.sog";
const SPLAT_URL = "/scenes/cour.sog";

export default function App() {
  const [activeHotspot, setActiveHotspot] = useState(null);

  return (
    <div className="app">
      <header className="app-header">
        <center><h1>Visite virtuelle</h1>
        <p className="app-subtitle">
          Faire glisser pour tourner autour de la scène, pince/molette pour
          zoomer, et cliquer un point pour s'y déplacer.
        </p></center>
      </header>

      <main className="app-main">
        <SplatViewer
          splatUrl={SPLAT_URL}
          hotspots={hotspots}
          onSelectHotspot={setActiveHotspot}
        />
      </main>

      <aside
        className={"legend-panel" + (activeHotspot ? " is-open" : "")}
        aria-hidden={!activeHotspot}
      >
        {activeHotspot && (
          <>
            <button
              className="legend-close"
              onClick={() => setActiveHotspot(null)}
              aria-label="Fermer"
            >
              ×
            </button>
            <h2>{activeHotspot.label}</h2>
            <p>{activeHotspot.description}</p>
          </>
        )}
      </aside>
    </div>
  );
}
