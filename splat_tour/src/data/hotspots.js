// Chaque hotspot correspond à un point d'intérêt dans la scène splat.
// - id: identifiant unique
// - position: [x, y, z] en coordonnées monde (mêmes unités que ton .sog/.ply)
// - label: texte court affiché sur le marqueur
// - description: texte affiché dans le panneau de légende au clic
// - cameraPosition / cameraTarget: où la caméra doit se déplacer quand on clique
//   ce hotspot (transition animée). Si omis, seul un zoom léger vers la position
//   du hotspot sera utilisé.
//
// ADAPTE CES VALEURS à ta propre scène : ouvre d'abord ton splat dans le viewer,
// oriente-toi avec la souris, et note les coordonnées approximatives des points
// que tu veux transformer en hotspots (voir le conseil dans le README).

// Les positions ci-dessous sont calées sur le splat de démo (un petit objet
// situé autour de [0, 0, -3], voir App.jsx). Avec ton propre scan, remplace
// entièrement ce tableau par tes propres coordonnées et textes.
export const hotspots = [
  {
    id: "Velo",
    position: [1.5, 3, 1.3],
    label: "Vélo",
    description:
      "Vélo gris métal avec détails en cuir..",
    cameraPosition: [-2.5, 3, 6.5],
    cameraTarget: [1.5, 3, 1.3],
  },
  {
    id: "Fontaine",
    position: [-8.2, 3, 9],
    label: "Fontaine",
    description:
      "Fontaine à eau potable en métal, présente dans la majorité des cours de Paris.",
    cameraPosition: [-4,3,4],
    cameraTarget: [-9, 3, 9],
  },
  {
    id: "fleur",
    position: [-10.7,3.2,0.3],
    label: "Hortensias",
    description:
      "Hydrangea est un genre d'arbustes et d'arbres appartenant à la famille des Hydrangeaceae dont l'espèce la plus connue est une espèce hybride, appelée Hydrangea ×serratophylla (hortensia), obtenue par croisement entre Hydrangea macrophylla et Hydrangea serrata.",
    cameraPosition: [-6,3,0],
    cameraTarget: [-10.5,3,0],
  },
];
