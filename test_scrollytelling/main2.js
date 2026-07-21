// ════════════════════════════════════════════════════════════
// CONFIG — MAIN PATH
// ════════════════════════════════════════════════════════════
const FRAME_COUNT = 500;
const FOLDER = 'frames/main_path/';
const PX_PER_FRAME = 30;

// Physique de la caméra sur le main path : "SmoothDamp" (même
// technique qu'Unity pour les caméras), un amortissement critique —
// mathématiquement garanti sans rebond, contrairement à un système
// ressort/friction réglé à la main qui peut osciller. La vitesse
// persiste quand même un instant après l'arrêt du scroll avant de
// s'annuler en douceur : c'est ce qui donne l'élan, sans jamais
// dépasser la cible pour revenir en arrière.
//
//   CAMERA_SMOOTH_TIME : temps approximatif (en secondes) pour que
//                         la caméra rejoigne sa cible.
//                         Plus grand = plus de glisse/élan.
//                         Plus petit = plus réactif/instantané.
const CAMERA_SMOOTH_TIME = 0.35;
const FRAME_DT = 1 / 60; // pas de temps supposé (tout le script tourne à 60fps)

// current, target, velocity, smoothTime, dt -> { pos, vel }
function smoothDamp(current, target, velocity, smoothTime, dt) {
    const st = Math.max(0.0001, smoothTime);
    const omega = 2 / st;

    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

    const change = current - target;
    const temp = (velocity + omega * change) * dt;

    let newVelocity = (velocity - omega * temp) * exp;
    let output = target + (change + temp) * exp;

    // garde-fou (rarement nécessaire ici, mais garanti à 100% par construction) :
    // ne jamais dépasser la cible et repartir dans l'autre sens
    if ((target - current > 0) === (output > target)) {
        output = target;
        newVelocity = 0;
    }

    return { pos: output, vel: newVelocity };
}

// ════════════════════════════════════════════════════════════
// CONFIG — BIKE PATH (boucle autour du vélo)
// ════════════════════════════════════════════════════════════
const BIKE_FOLDER = 'frames/bike_path/';
const BIKE_FRAME_COUNT = 600; // frames 0001 à 0600, la 600 boucle vers la 1

// Zone du main path où le bouton "voir le vélo" est visible
const BIKE_ENTRY_MAIN_START = 348;
const BIKE_ENTRY_MAIN_END = 378;

// Frames équivalentes côté bike path (0-indexées)
// main 348 == bike frame 1 (index 0) / main 378 == bike frame 81 (index 80)
const BIKE_ENTRY_START_FRAME = 0;
const BIKE_ENTRY_END_FRAME = 80;

// Vitesses (en frames par tick d'animation, ~60 ticks/s)
const BIKE_PLAY_SPEED = 0.5;    // vitesse de la boucle en continu
const BIKE_RETURN_SPEED = 1.5;  // vitesse pour revenir au point d'entrée à la sortie

// Si true, on autorise à revenir "en arrière" dans la boucle pour sortir
// plus vite (chemin le plus court). Si false, on termine toujours le tour
// en avançant jusqu'au point d'entrée.
const BIKE_RETURN_ALLOW_REVERSE = true;

// ════════════════════════════════════════════════════════════
// ANNOTATIONS (points d'intérêt sur le main path ET le bike path)
// ════════════════════════════════════════════════════════════
//
// Pour ajouter une nouvelle annotation, ajoute simplement un objet
// dans ce tableau. Pas besoin de toucher au HTML ni au CSS.
//
//   id         : identifiant unique (utile pour le debug)
//   label      : texte affiché
//   path       : 'main' ou 'bike' — sur quel chemin l'annotation vit
//   start/end  : plage de frames où elle est visible, sur ce chemin.
//                Pour le bike path (boucle 0-599), start peut être
//                supérieur à end : la plage traverse alors le point
//                de bouclage (ex: start:580, end:20 = visible de 580
//                à 599 puis de 0 à 20).
//   direction  : 'up-right' | 'up-left' | 'down-right' | 'down-left'
//                (de quel côté partent la ligne et le texte)
//   track      : positions-clés en pixels, dans le repère de l'image
//                source correspondant au `path` choisi. Les frames
//                entre deux repères sont interpolées automatiquement.
//                (Si la plage traverse le point de bouclage, préfère
//                ne pas placer de repère exactement à 0 ou 599 sans
//                l'autre, l'interpolation ne boucle pas circulairement.)
//
// Astuce pour mesurer les coordonnées : active DEBUG_PICK (voir plus
// bas) et clique directement sur l'élément à l'écran, la console
// affiche les coordonnées prêtes à copier — ça fonctionne aussi bien
// en mode main qu'en mode bike, il indique automatiquement le chemin.
const ANNOTATIONS = [
    {
        id: 'flower',
        label: 'Hortensias',
        path: 'main',
        start: 236,
        end: 258,
        direction: 'up-right',
        track: {
            236: { x: 996, y: 443 },
            240: { x: 1009, y: 431 },
            243: { x: 1022, y: 413 },
            246: { x: 1020, y: 400 },
            249: { x: 995, y: 418 },
            253: { x: 970, y: 430 },
            256: { x: 955, y: 436 },
            259: { x: 948, y: 445 },
        },
    },

    {
        id: 'robinet',
        label: 'Robinet extérieur',
        path: 'main',
        start: 170,
        end: 200,
        direction: 'up-left',
        track: {
            170: { x: 694, y: 280 },
            173: { x: 696, y: 274 },
            176: { x: 698, y: 273 },
            180: { x: 706, y: 259 },
            183: { x: 713, y: 245 },
            186: { x: 724, y: 237 },
            190: { x: 753, y: 231 },
            193: { x: 780, y: 240 },
            196: { x: 756, y: 264 },
            200: { x: 644, y: 278 },
        },
    },

    {
        id: 'arrosoir',
        label: 'Arrosoir',
        path: 'main',
        start: 180,
        end: 200,
        direction: 'up-right',
        track: {
            180: { x: 942, y: 545 },
            183: { x: 984, y: 543 },
            186: { x: 1030, y: 541 },
            190: { x: 1093, y: 544 },
            193: { x: 1133, y: 554 },
            196: { x: 1105, y: 561 },
            200: { x: 1010, y: 573 },
            203: { x: 950, y: 580 },
        },
    },

    {
        id: 'guidon',
        label: 'guidon aluminium, argent poli',
        path: 'bike',
        start: 106,
        end: 169,
        direction: 'up-right',
        track: {
            106: { x: 977, y: 219 },
            114: { x: 977, y: 213 },
            120: { x: 980, y: 206 },
            125: { x: 984, y: 197 },
            131: { x: 1001, y: 182 },
            136: { x: 1024, y: 168 },
            140: { x: 1046, y: 159 },
            149: { x: 1105, y: 146 },
            156: { x: 1139, y: 141 },
            163: { x: 1167, y: 133 },
            169: { x: 1189, y: 126 },
        },
    },

    {
        id: 'Cadre',
        label: 'cadre en acier haute résistance',
        path: 'bike',
        start: 255,
        end: 346,
        direction: 'up-right',
        track: {
            255: { x: 983, y: 388 },
            260: { x: 983, y: 387 },
            264: { x: 983, y: 387 },
            269: { x: 983, y: 385 },
            275: { x: 983, y: 387 },
            284: { x: 980, y: 387 },
            292: { x: 977, y: 389 },
            299: { x: 974, y: 396 },
            304: { x: 974, y: 396 },
            307: { x: 974, y: 396 },
            312: { x: 974, y: 396 },
            316: { x: 974, y: 400 },
            325: { x: 970, y: 400 },
            331: { x: 970, y: 409 },
            335: { x: 964, y: 407 },
            346: { x: 963, y: 413 },

        },
    },

    {
        id: 'Moyeux',
        label: 'moyeux Novatec Aliage',
        path: 'bike',
        start: 142,
        end: 310,
        direction: 'up-right',
        track: {
            142: { x: 901, y: 840 },
            147: { x: 937, y: 838 },
            152: { x: 981, y: 822 },
            158: { x: 1022, y: 806 },
            162: { x: 1050, y: 789 },
            167: { x: 1075, y: 772 },
            172: { x: 1104, y: 755 },
            176: { x: 1123, y: 751 },
            180: { x: 1151, y: 749 },
            186: { x: 1180, y: 747 },
            191: { x: 1205, y: 756 },
            196: { x: 1228, y: 764 },
            201: { x: 1243, y: 778 },
            206: { x: 1252, y: 796 },
            211: { x: 1253, y: 811 },
            217: { x: 1244, y: 830 },
            221: { x: 1240, y: 844 },
            227: { x: 1225, y: 861 },
            231: { x: 1214, y: 873 },
            235: { x: 1203, y: 881 },
            240: { x: 1196, y: 889 },
            244: { x: 1193, y: 898 },
            250: { x: 1198, y: 905 },
            255: { x: 1210, y: 903 },
            260: { x: 1215, y: 903 },
            265: { x: 1219, y: 905 },
            270: { x: 1222, y: 901 },
            275: { x: 1222, y: 894 },
            280: { x: 1223, y: 894 },
            285: { x: 1220, y: 889 },
            290: { x: 1214, y: 881 },
            296: { x: 1212, y: 876 },
            300: { x: 1205, y: 869 },
            306: { x: 1196, y: 863 },
            310: { x: 1190, y: 858 },
        },
    },

    {
        id: 'chaine',
        label: 'chaine KMC Z72',
        path: 'bike',
        start: 271,
        end: 405,
        direction: 'up-right',
        track: {
            271: { x: 541, y: 801 },
            278: { x: 525, y: 807 },
            282: { x: 519, y: 807 },
            286: { x: 512, y: 813 },
            293: { x: 506, y: 816 },
            302: { x: 508, y: 816 },
            306: { x: 512, y: 814 },
            313: { x: 521, y: 814 },
            320: { x: 535, y: 809 },
            327: { x: 562, y: 802 },
            332: { x: 568, y: 800 },
            336: { x: 586, y: 797 },
            342: { x: 606, y: 791 },
            347: { x: 626, y: 783 },
            353: { x: 646, y: 778 },
            357: { x: 663, y: 775 },
            362: { x: 682, y: 768 },
            367: { x: 701, y: 764 },
            370: { x: 713, y: 763 },
            375: { x: 732, y: 753 },
            379: { x: 747, y: 755 },
            384: { x: 763, y: 751 },
            388: { x: 781, y: 746 },
            392: { x: 796, y: 744 },
            397: { x: 812, y: 740 },
            401: { x: 824, y: 737 },
            405: { x: 839, y: 731 },
        },
    },

    {
        id: 'pneu',
        label: 'pneus Kenda 700 x 28c',
        path: 'bike',
        start: 399,
        end: 451,
        direction: 'up-right',
        track: {
            399: { x: 249, y: 530 },
            403: { x: 307, y: 534 },
            407: { x: 356, y: 534 },
            410: { x: 406, y: 540 },
            413: { x: 434, y: 539 },
            415: { x: 472, y: 545 },
            419: { x: 513, y: 550 },
            422: { x: 544, y: 553 },
            426: { x: 596, y: 562 },
            430: { x: 635, y: 569 },
            434: { x: 680, y: 581 },
            438: { x: 722, y: 591 },
            442: { x: 760, y: 604 },
            445: { x: 794, y: 612 },
            448: { x: 827, y: 626 },
            451: { x: 863, y: 626 },
        },

    },


    // Exemple d'annotation sur le bike path — décommente et adapte :
    // {
    //     id: 'saddle',
    //     label: 'selle en cuir',
    //     path: 'bike',
    //     start: 0,
    //     end: 599,
    //     direction: 'up-left',
    //     track: {
    //         0: { x: 500, y: 480 },
    //         300: { x: 700, y: 520 },
    //         599: { x: 500, y: 480 },
    //     },
    // },
];

// Préréglages géométriques par direction : angle de la diagonale (en
// degrés, convention CSS rotate), longueur de la diagonale, longueur
// du soulignement (signée : négative = part vers la gauche), décalage
// vertical du texte par rapport au soulignement, et alignement du texte.
const ANNOTATION_PRESETS = {
    'up-right': { angle: -39, length: 71, underlineLength: 55, labelOffset: -17, align: 'left' },
    'up-left': { angle: -141, length: 71, underlineLength: -55, labelOffset: -17, align: 'right' },
    'down-right': { angle: 39, length: 71, underlineLength: 55, labelOffset: 17, align: 'left' },
    'down-left': { angle: 141, length: 71, underlineLength: -55, labelOffset: 17, align: 'right' },
};

function getTrackPoint(track, frame) {
    const keys = Object.keys(track).map(Number).sort((a, b) => a - b);
    if (keys.length === 0) return null;

    if (frame <= keys[0]) return track[keys[0]];
    if (frame >= keys[keys.length - 1]) return track[keys[keys.length - 1]];

    for (let i = 0; i < keys.length - 1; i++) {
        const k0 = keys[i], k1 = keys[i + 1];
        if (frame >= k0 && frame <= k1) {
            const t = (frame - k0) / (k1 - k0);
            const p0 = track[k0], p1 = track[k1];

            return {
                x: p0.x + (p1.x - p0.x) * t,
                y: p0.y + (p1.y - p0.y) * t,
            };
        }
    }

    return track[keys[keys.length - 1]];
}

// convertit un point en repère "image source" (px) vers un point
// écran (px CSS), en s'appuyant sur le dernier cadrage "cover" calculé
function imagePointToScreen(img, x, y) {
    if (!img || !img.naturalWidth || !lastDWidth || !lastDHeight) return null;

    const dpr = window.devicePixelRatio || 1;

    return {
        x: (lastDX + (x / img.naturalWidth) * lastDWidth) / dpr,
        y: (lastDY + (y / img.naturalHeight) * lastDHeight) / dpr,
    };
}

// vérifie si `frame` est dans la plage [start, end]. Si start > end,
// la plage traverse le point de bouclage (utile pour le bike path)
function isFrameInRange(frame, start, end) {
    if (start <= end) return frame >= start && frame <= end;
    return frame >= start || frame <= end;
}

// met à jour la position/visibilité de toutes les annotations pour
// le chemin actif ('main' ou 'bike') à la frame donnée. Les
// annotations de l'autre chemin sont masquées.
function updateAnnotations(activePath, frame) {
    for (const inst of annotationInstances) {
        const { config, root, anchor } = inst;

        if (config.path !== activePath) {
            root.classList.remove('visible');
            continue;
        }

        const isVisible = isFrameInRange(frame, config.start, config.end);
        root.classList.toggle('visible', isVisible);

        if (isVisible) {
            const point = getTrackPoint(config.track, frame);
            const img = activePath === 'bike' ? bikeFrames[frame] : frames[frame];
            const screenPoint = point ? imagePointToScreen(img, point.x, point.y) : null;

            if (screenPoint) {
                anchor.style.left = screenPoint.x + 'px';
                anchor.style.top = screenPoint.y + 'px';
            }
        }
    }
}

// construit le DOM d'une annotation (point + ligne + soulignement + texte)
// et applique la géométrie du préréglage choisi
function createAnnotationDOM(config, container) {
    const preset = ANNOTATION_PRESETS[config.direction] || ANNOTATION_PRESETS['up-right'];

    const root = document.createElement('div');
    root.className = 'legend';
    root.dataset.id = config.id;

    const anchor = document.createElement('div');
    anchor.className = 'legend-anchor';

    const dot = document.createElement('span');
    dot.className = 'legend-dot';

    const diag = document.createElement('span');
    diag.className = 'legend-diag';

    const underline = document.createElement('span');
    underline.className = 'legend-underline';

    const label = document.createElement('span');
    label.className = 'legend-label';
    label.textContent = config.label;

    anchor.append(dot, diag, underline, label);
    root.append(anchor);
    container.append(root);

    // géométrie déduite de l'angle/longueur du préréglage
    const rad = preset.angle * Math.PI / 180;
    const dx = preset.length * Math.cos(rad);
    const dy = preset.length * Math.sin(rad);

    const underlineNegative = preset.underlineLength < 0;
    const underlineW = Math.abs(preset.underlineLength);
    const underlineLeft = dx + (underlineNegative ? preset.underlineLength : 0);

    root.style.setProperty('--angle', preset.angle + 'deg');
    root.style.setProperty('--diag-length', preset.length + 'px');

    underline.style.width = underlineW + 'px';
    underline.style.left = underlineLeft + 'px';
    underline.style.top = dy + 'px';
    underline.style.transformOrigin = underlineNegative ? 'right center' : 'left center';

    label.style.textAlign = preset.align;
    label.style.top = (dy + preset.labelOffset) + 'px';
    label.dataset.align = preset.align;

    if (preset.align === 'right') {
        label.style.left = (underlineLeft + underlineW) + 'px';
    } else {
        label.style.left = underlineLeft + 'px';
    }

    return { config, root, anchor };
}

// ════════════════════════════════════════════════════════════
// DOM
// ════════════════════════════════════════════════════════════
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

const driver = document.getElementById('scroll-driver');
const progress = document.getElementById('progress');
const loader = document.getElementById('loader');
const loadText = document.getElementById('load-text');

const bikeBtn = document.getElementById('bike-btn');
const exitBikeBtn = document.getElementById('exit-bike-btn');
const scrollHint = document.getElementById('scroll-hint');

const annotationsLayer = document.getElementById('annotations-layer');
let annotationInstances = [];

if (!annotationsLayer) {
    console.warn(
        '[annotations] #annotations-layer introuvable dans le DOM. ' +
        'Ajoute <div id="annotations-layer"></div> dans ton HTML.'
    );
} else {
    annotationInstances = ANNOTATIONS.map((config) => createAnnotationDOM(config, annotationsLayer));
}

// ── OUTIL DEV : clique sur le canvas pour récupérer les coordonnées
// "image source" d'un point. Pratique pour remplir un `track` à la
// main : scrolle jusqu'à la frame voulue, tape `DEBUG_PICK = true`
// dans la console, puis clique sur l'élément à l'écran.
let DEBUG_PICK = false;

canvas.addEventListener('click', (e) => {
    if (!DEBUG_PICK) return;

    const isBike = mode === 'bike';
    const frame = isBike
        ? Math.round(mod(bikeCurrent, BIKE_FRAME_COUNT))
        : clamp(Math.round(current), 0, FRAME_COUNT - 1);

    const img = isBike ? bikeFrames[frame] : frames[frame];
    if (!img || !img.naturalWidth || !lastDWidth || !lastDHeight) return;

    const dpr = window.devicePixelRatio || 1;
    const canvasX = e.clientX * dpr;
    const canvasY = e.clientY * dpr;

    const x = Math.round(((canvasX - lastDX) / lastDWidth) * img.naturalWidth);
    const y = Math.round(((canvasY - lastDY) / lastDHeight) * img.naturalHeight);

    console.log(`[${isBike ? 'bike' : 'main'}] Frame ${frame} → { x: ${x}, y: ${y} }`);
});

// ════════════════════════════════════════════════════════════
// ÉTAT
// ════════════════════════════════════════════════════════════
const frames = [];
const bikeFrames = [];

let loaded = 0;

let mode = 'main'; // 'main' | 'bike'

// -- main path --
let current = 0;
let target = 0;
let velocity = 0; // vitesse actuelle de la caméra (pour l'effet d'élan)

// -- bike path --
let bikeCurrent = 0;   // position courante dans la boucle (0..599)
let bikeEntryFrame = 0; // frame bike correspondant au point d'entrée/sortie
let bikeExiting = false;

let lastDX = 0, lastDY = 0, lastDWidth = 0, lastDHeight = 0;

// ════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const mod = (n, m) => ((n % m) + m) % m;

// ════════════════════════════════════════════════════════════
// LAYOUT / RESIZE
// ════════════════════════════════════════════════════════════
driver.style.height = (window.innerHeight + FRAME_COUNT * PX_PER_FRAME) + 'px';

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    driver.style.height = (window.innerHeight + FRAME_COUNT * PX_PER_FRAME) + 'px';

    const idx = mode === 'main'
        ? clamp(Math.round(current), 0, FRAME_COUNT - 1)
        : clamp(Math.round(bikeCurrent), 0, BIKE_FRAME_COUNT - 1);

    renderFrame(idx);
}

window.addEventListener('resize', resizeCanvas);

// ════════════════════════════════════════════════════════════
// CHARGEMENT DES FRAMES
// ════════════════════════════════════════════════════════════
for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const n = String(i + 1).padStart(4, '0');
    img.src = `${FOLDER}${n}_composite.png`;

    img.onload = () => {
        loaded++;
        loadText.innerText = `Loading Virtual Visit... ${Math.round((loaded / FRAME_COUNT) * 100)}%`;

        if (loaded === FRAME_COUNT) {
            loader.style.opacity = 0;
            setTimeout(() => {
                loader.style.display = 'none';
                scrollHint.classList.add('visible');
            }, 500);
            resizeCanvas();
        }
    };

    img.onerror = () => console.warn('Frame main introuvable :', img.src);

    frames[i] = img;
}

for (let i = 0; i < BIKE_FRAME_COUNT; i++) {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const n = String(i + 1).padStart(4, '0');
    img.src = `${BIKE_FOLDER}${n}_color.png`;

    img.onerror = () => console.warn('Frame bike introuvable :', img.src);

    bikeFrames[i] = img;
}

// ════════════════════════════════════════════════════════════
// CORRESPONDANCE MAIN <-> BIKE
// ════════════════════════════════════════════════════════════
function mainToBikeFrame(mainFrame) {
    const t = (mainFrame - BIKE_ENTRY_MAIN_START) / (BIKE_ENTRY_MAIN_END - BIKE_ENTRY_MAIN_START);
    const clampedT = clamp(t, 0, 1);

    return BIKE_ENTRY_START_FRAME + clampedT * (BIKE_ENTRY_END_FRAME - BIKE_ENTRY_START_FRAME);
}

function bikeToMainFrame(bikeFrame) {
    const clamped = clamp(bikeFrame, BIKE_ENTRY_START_FRAME, BIKE_ENTRY_END_FRAME);
    const t = (clamped - BIKE_ENTRY_START_FRAME) / (BIKE_ENTRY_END_FRAME - BIKE_ENTRY_START_FRAME);

    return BIKE_ENTRY_MAIN_START + t * (BIKE_ENTRY_MAIN_END - BIKE_ENTRY_MAIN_START);
}

// ════════════════════════════════════════════════════════════
// SCROLL (uniquement actif en mode "main", le body étant en
// overflow:hidden pendant la boucle vélo, ce listener ne se
// déclenche de toute façon pas dans ce cas)
// ════════════════════════════════════════════════════════════
window.addEventListener('scroll', () => {
    if (mode !== 'main') return;

    const scrolled = window.scrollY;
    const total = driver.offsetHeight - window.innerHeight;
    const pct = clamp(scrolled / total, 0, 1);

    target = pct * (FRAME_COUNT - 1);
    progress.style.width = (pct * 100) + '%';
}, { passive: true });

// masque le message "scrollez pour vous déplacer" dès le premier
// scroll de l'utilisateur, une bonne fois pour toutes
window.addEventListener('scroll', () => {
    scrollHint.classList.remove('visible');
}, { once: true, passive: true });

// ════════════════════════════════════════════════════════════
// DESSIN
// ════════════════════════════════════════════════════════════
function drawCover(img, alpha = 1) {
    if (!img || !img.complete || !img.naturalWidth) return;

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = canvas.width / canvas.height;

    let dWidth, dHeight, dx, dy;

    if (canvasRatio > imgRatio) {
        dWidth = canvas.width;
        dHeight = canvas.width / imgRatio;
        dx = 0;
        dy = (canvas.height - dHeight) / 2;
    } else {
        dWidth = canvas.height * imgRatio;
        dHeight = canvas.height;
        dx = (canvas.width - dWidth) / 2;
        dy = 0;
    }

    lastDX = dx;
    lastDY = dy;
    lastDWidth = dWidth;
    lastDHeight = dHeight;

    ctx.globalAlpha = alpha;
    ctx.drawImage(img, dx, dy, dWidth, dHeight);
    ctx.globalAlpha = 1;
}

function renderFrame(index) {
    const img = mode === 'main' ? frames[index] : bikeFrames[index];
    if (!img || !img.complete || !img.naturalWidth) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCover(img);
}

// ════════════════════════════════════════════════════════════
// ENTRÉE / SORTIE DE LA BOUCLE VÉLO
// ════════════════════════════════════════════════════════════
bikeBtn.onclick = () => {
    if (mode !== 'main') return;

    const mainFrame = Math.round(current);
    const entryFrame = mainToBikeFrame(mainFrame);

    bikeEntryFrame = entryFrame;
    bikeCurrent = entryFrame;
    bikeExiting = false;
    mode = 'bike';

    bikeBtn.style.display = 'none';
    exitBikeBtn.style.display = 'block';

    // on bloque le scroll pendant la visite du vélo
    document.body.style.overflow = 'hidden';
};

exitBikeBtn.onclick = () => {
    if (mode !== 'bike' || bikeExiting) return;
    bikeExiting = true;
};

function finishBikeExit() {
    bikeCurrent = bikeEntryFrame;
    mode = 'main';

    const mainFrame = bikeToMainFrame(bikeEntryFrame);
    current = mainFrame;
    target = mainFrame;
    velocity = 0; // évite qu'une vitesse résiduelle ne refasse bouger la caméra au retour

    bikeExiting = false;
    exitBikeBtn.style.display = 'none';

    document.body.style.overflow = '';
    // le bouton vélo réapparaîtra tout seul au prochain tick
    // puisqu'on est toujours dans la zone [348, 378]
};

// ════════════════════════════════════════════════════════════
// BOUCLE D'ANIMATION
// ════════════════════════════════════════════════════════════
(function loop() {

    if (mode === 'main') {

        // amortissement critique : glisse naturelle après l'arrêt
        // du scroll, sans jamais dépasser la cible
        const result = smoothDamp(current, target, velocity, CAMERA_SMOOTH_TIME, FRAME_DT);
        current = result.pos;
        velocity = result.vel;

        const frame = clamp(Math.round(current), 0, FRAME_COUNT - 1);

        const inBikeZone = frame >= BIKE_ENTRY_MAIN_START && frame <= BIKE_ENTRY_MAIN_END;
        bikeBtn.style.display = inBikeZone ? 'flex' : 'none';

        renderFrame(frame);
        updateAnnotations('main', frame);

    } else { // mode === 'bike'
        if (!bikeExiting) {
            // lecture en boucle continue vers l'avant
            bikeCurrent = mod(bikeCurrent + BIKE_PLAY_SPEED, BIKE_FRAME_COUNT);

        } else {
            // on rejoint le point d'entrée pour repasser sur le main path
            const forwardDist = mod(bikeEntryFrame - bikeCurrent, BIKE_FRAME_COUNT);
            const backwardDist = mod(bikeCurrent - bikeEntryFrame, BIKE_FRAME_COUNT);

            const goBackward = BIKE_RETURN_ALLOW_REVERSE && backwardDist < forwardDist;
            const remaining = goBackward ? backwardDist : forwardDist;

            if (remaining <= BIKE_RETURN_SPEED) {
                finishBikeExit();
            } else {
                bikeCurrent = mod(
                    bikeCurrent + (goBackward ? -BIKE_RETURN_SPEED : BIKE_RETURN_SPEED),
                    BIKE_FRAME_COUNT
                );
            }
        }

        // finishBikeExit() peut avoir basculé mode -> 'main' à l'instant :
        // dans ce cas on ne dessine plus rien côté bike sur ce tick
        // (sinon on piocherait par erreur dans `frames` avec un index
        // bike, d'où le flash de la frame 1 du main). Le prochain appel
        // de loop() verra mode === 'main' et dessinera la bonne frame.
        if (mode === 'bike') {
            const bikeFrame = Math.round(mod(bikeCurrent, BIKE_FRAME_COUNT));
            renderFrame(bikeFrame);
            updateAnnotations('bike', bikeFrame);
        }
    }

    requestAnimationFrame(loop);

})();