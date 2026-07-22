# Visite virtuelle — starter Spark + React

Starter fonctionnel pour une visite virtuelle en Gaussian Splatting : rendu via
[Spark](https://sparkjs.dev/) (Three.js), hotspots cliquables, panneau de
légende, transitions de caméra animées, optimisé mobile.
 
## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvre l'URL affichée (ex. `http://localhost:5173`). Par défaut le projet
charge un splat de démonstration hébergé par Spark, donc ça fonctionne tout
de suite sans rien configurer.

## Utiliser tes propres scans

1. **Convertis ton `.ply` en `.sog`** (bien plus léger, donc bien plus rapide
   à charger sur mobile — souvent 15-20× plus petit). Installe l'outil
   PlayCanvas :

   ```bash
   npm install -g @playcanvas/splat-transform
   splat-transform mon-scan.ply mon-scan.sog
   ```

   Si tu as déjà des `.sog`, tu peux les utiliser directement.

2. **Place le fichier** dans `public/scenes/`, par exemple
   `public/scenes/mon-scan.sog`.

3. **Mets à jour `SPLAT_URL`** dans `src/App.jsx` :

   ```js
   const SPLAT_URL = "/scenes/mon-scan.sog";
   ```

4. **Trouve les coordonnées de tes hotspots.** Le plus simple : lance
   `npm run dev`, ouvre la console du navigateur, et ajoute temporairement ce
   code dans `SplatViewer.jsx` (juste après `controls.update()` dans
   `animate()`) pour afficher la position de la caméra en direct pendant que
   tu navigues :

   ```js
   console.log(camera.position.toArray(), controls.target.toArray());
   ```

   Positionne-toi où tu veux placer un hotspot, note les coordonnées de
   `controls.target` (le point regardé) pour `position`, et celles de
   `camera.position` / `controls.target` pour `cameraPosition` /
   `cameraTarget`. Supprime le `console.log` une fois terminé.

5. **Édite `src/data/hotspots.js`** avec tes propres points, labels et
   descriptions.

## Structure du projet

```
src/
  components/SplatViewer.jsx   # scène Three.js + Spark, hotspots, resize
  data/hotspots.js             # tes points d'intérêt (à éditer)
  utils/cameraTween.js         # transition caméra animée (sans dépendance)
  App.jsx                      # assemble le viewer + le panneau de légende
  styles.css                   # UI mobile-first (bottom sheet sur mobile)
```

## Pistes pour aller plus loin

- **Animations de scène** : Spark permet d'animer/déformer les splats
  eux-mêmes (pas seulement la caméra) via `objectModifiers` /
  `onFrame` sur `SplatMesh` — utile pour des effets d'apparition/dévoilement.
  Voir la doc : https://sparkjs.dev/docs/
- **Scènes multiples** : pour une visite avec plusieurs pièces/zones,
  charge plusieurs `SplatMesh` (un par zone) et affiche/masque-les, ou
  échange l'URL chargée selon la zone active.
- **Streaming pour grosses scènes** : si ton scan dépasse plusieurs millions
  de gaussiennes, utilise le mode "Streamed SOG" (généré automatiquement par
  `splat-transform` pour les gros fichiers) pour un chargement progressif.
- **Performance mobile** : le `pixelRatio` est déjà plafonné à 1.5 dans
  `SplatViewer.jsx` — sur des appareils très bas de gamme, tu peux le
  descendre à 1, ou réduire `maxSplats` dans les options de `SplatMesh`.

## Build de production

```bash
npm run build
```

Le dossier `dist/` généré est un site statique déployable tel quel sur
Netlify, Vercel, GitHub Pages, ou tout hébergeur statique — pense juste à
bien uploader aussi ton/tes fichier(s) `.sog` avec.
