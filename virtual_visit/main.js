// ── CONFIG ──────────────────────────────
const FRAME_COUNT = 500;
const FOLDER = 'frames/main_path/';
const PX_PER_FRAME = 30;
const LERP = 0.10;
const BIKE_LERP = 0.025;
// ────────────────────────────────────────
// velo between 348 et 378
const BIKE_FRAME_COUNT = 600;
const bikeFrames = [];

const BIKE_START_FRAME = 0;
const BIKE_END_FRAME = BIKE_FRAME_COUNT - 1;//37; // frame 0038

const BIKE_START_MAIN = 348;
const BIKE_END_MAIN = 378;

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

const driver = document.getElementById('scroll-driver');
const progress = document.getElementById('progress');
const loader = document.getElementById('loader');
const loadText = document.getElementById('load-text');

const bikeBtn = document.getElementById('bike-btn');
const exitBikeBtn = document.getElementById("exit-bike-btn");

// bikeBtn.onclick = () => {

//     bikeBtn.style.display = "none";

//     // récupérer la position actuelle
//     const mainFrame = current;

//     mode = "bike";

//     // démarrer exactement au bon endroit
//     bikeCurrent = mainToBikeFrame(mainFrame);

//     bikeTarget = BIKE_FRAME_COUNT - 1;
// };

bikeBtn.onclick = () => {

    bikeBtn.style.display = "none";


    mode = "bike";

    bikePlaying = true;
    bikeStopping = false;

    const mainFrame = Math.round(current)
    bikeCurrent = mainToBikeFrame(mainFrame);

    // mémorise le point de départ
    bikeStartFrame = bikeCurrent;

};

exitBikeBtn.onclick = () => {


    bikeStopping = true;

    // mémorise la frame actuelle
    //bikeExitFrame = bikeCurrent;


};

function mainToBikeFrame(mainFrame) {

    const progress =
        (mainFrame - BIKE_START_MAIN) /
        (BIKE_END_MAIN - BIKE_START_MAIN);


    return progress *
        (BIKE_END_FRAME - BIKE_START_FRAME);
}

function bikeToMainFrame(bikeFrame) {
    const clamped = Math.max(BIKE_START_FRAME, Math.min(BIKE_END_FRAME, bikeFrame));

    const progress =
        (clamped - BIKE_START_FRAME) /
        (BIKE_END_FRAME - BIKE_START_FRAME);

    return BIKE_START_MAIN +
        progress * (BIKE_END_MAIN - BIKE_START_MAIN);
}

const frames = [];
// const masks = [];

let loaded = 0;
let current = 0;
let target = 0;

let hovered = false;
let clicked = false;

let lastDX = 0;
let lastDY = 0;
let lastDWidth = 0;
let lastDHeight = 0;

const hitCanvas = document.createElement('canvas');
const hitCtx = hitCanvas.getContext('2d');

// ────────────────────────────────────────
// layout height
driver.style.height =
  (window.innerHeight + FRAME_COUNT * PX_PER_FRAME) + 'px';

// ────────────────────────────────────────
// resize
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    driver.style.height =
      (window.innerHeight + FRAME_COUNT * PX_PER_FRAME) + 'px';

    renderFrame(Math.round(current));
}

// ────────────────────────────────────────
// LOAD FRAMES
for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.crossOrigin = "anonymous";

    const n = String(i + 1).padStart(4, '0');
    img.src = `${FOLDER}${n}_composite.png`;

    img.onload = () => {
        loaded++;
        loadText.innerText =
          `Loading Virtual Visit... ${Math.round((loaded / FRAME_COUNT) * 100)}%`;

        if (loaded === FRAME_COUNT) {
            loader.style.opacity = 0;
            setTimeout(() => loader.style.display = 'none', 500);
            resizeCanvas();
        }
    };

    frames[i] = img;
}
// ---------------------------------------------
//LOAD BIKE FRAMES

for (let i = 0; i < BIKE_FRAME_COUNT; i++) {

    const img = new Image();

    const n = String(i + 1).padStart(4, "0");
    img.src = `frames/bike_path/${n}_color.png`;

    bikeFrames[i] = img;
}

let mode = "main"; // "main" ou "bike"
let bikeCurrent = 0;
let bikeTarget = 0;

let bikePlaying = false;
let bikeStopping = false;

//let bikeDirection = 1;

let bikeStartFrame = 0;
let bikeExitFrame = 0;

// ────────────────────────────────────────
// // LOAD MASKS
// for (let i = 0; i < FRAME_COUNT; i++) {
//     const img = new Image();
//     img.crossOrigin = "anonymous";

//     const n = String(i + 1).padStart(4, '0');
//     img.src = `binary_masks/LEVEL_SEQUENCE.FinalImageMASK.${n}.jpeg`;

//     masks[i] = img;
// }

// ────────────────────────────────────────
// SCROLL
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = driver.offsetHeight - window.innerHeight;

    const pct = Math.max(0, Math.min(1, scrolled / total));

    target = pct * (FRAME_COUNT - 1);

    progress.style.width = (pct * 100) + '%';
}, { passive: true });

// ────────────────────────────────────────
// DRAW FRAME
function renderFrame(index) {

    //const img = frames[index];
    const img = mode === "main" ? frames[index] : bikeFrames[index];
    if (!img || !img.complete || !img.naturalWidth) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    // draw base frame
    ctx.drawImage(img, dx, dy, dWidth, dHeight);

    // highlight
    // if (clicked) {
    //     drawMaskHighlight(index);
    // }
}

// ────────────────────────────────────────
// CLEAN MASK HIGHLIGHT (FIXED)
function drawMaskHighlight(index) {

    const mask = masks[index];
    if (!mask || !mask.complete) return;

    const pulse =
        0.25 +
        Math.abs(Math.sin(performance.now() * 0.004)) * 0.35;

    // STEP 1: draw mask into temp canvas
    hitCanvas.width = canvas.width;
    hitCanvas.height = canvas.height;

    hitCtx.clearRect(0, 0, hitCanvas.width, hitCanvas.height);

    hitCtx.drawImage(
        mask,
        lastDX,
        lastDY,
        lastDWidth,
        lastDHeight
    );

    const { data } = hitCtx.getImageData(
        0, 0,
        hitCanvas.width,
        hitCanvas.height
    );

    // STEP 2: draw ONLY colored pixels directly (NO full-image replacement)

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // const color = `rgba(0,255,200,${pulse})`;
    const color = `rgba(0,255,200)`;

    ctx.fillStyle = color;

    for (let y = 0; y < hitCanvas.height; y++) {
        for (let x = 0; x < hitCanvas.width; x++) {

            const i = (y * hitCanvas.width + x) * 4;

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const isWhite = r > 245 && g > 245 && b > 245;

            if (isWhite) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    ctx.restore();
}
// ────────────────────────────────────────
// HIT TEST (simple + fast)
function isPointInsideMask(x, y) {

    const frameIndex = Math.round(current);
    const mask = masks[frameIndex];

    if (!mask || !mask.complete) return false;

    hitCanvas.width = canvas.width;
    hitCanvas.height = canvas.height;

    hitCtx.clearRect(0, 0, hitCanvas.width, hitCanvas.height);

    hitCtx.drawImage(
        mask,
        lastDX,
        lastDY,
        lastDWidth,
        lastDHeight
    );

    const pixel = hitCtx.getImageData(
        Math.round(x),
        Math.round(y),
        1, 1
    ).data;

    return pixel[0] > 200; // white mask
}

// ────────────────────────────────────────
// MOUSE
function getCanvasPoint(e) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

canvas.addEventListener('mousemove', e => {
    const p = getCanvasPoint(e);

    // hovered = isPointInsideMask(p.x, p.y);

    // canvas.style.cursor = hovered ? 'pointer' : 'default';
});

// canvas.addEventListener('click', e => {
//     const p = getCanvasPoint(e);

//     // if (!isPointInsideMask(p.x, p.y)) return;

//     clicked = isPointInsideMask(p.x, p.y);

//     console.log("Object clicked at frame:", Math.round(current));
// });

// ────────────────────────────────────────
// LOOP
// (function loop() {

//     current += (target - current) * LERP;

//     const frame = Math.round(current);

//     if (
//         mode === "main" &&
//         frame >= 352 &&
//         frame <= 378
//     ){
//         bikeBtn.style.display = "block";
//     }
//     else{
//         bikeBtn.style.display = "none";
//     }

//     renderFrame(
//         Math.min(
//             FRAME_COUNT - 1,
//             Math.max(0, Math.round(current))
//         )
//     );

//     requestAnimationFrame(loop);

// })();

function drawImageAlpha(img, alpha) {

    if(
        !img ||
        !img.complete ||
        !img.naturalWidth
    ) return;


    const imgRatio =
        img.naturalWidth / img.naturalHeight;

    const canvasRatio =
        canvas.width / canvas.height;


    let dWidth;
    let dHeight;
    let dx;
    let dy;


    if(canvasRatio > imgRatio){

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


    ctx.globalAlpha = alpha;

    ctx.drawImage(
        img,
        dx,
        dy,
        dWidth,
        dHeight
    );

    ctx.globalAlpha = 1;
}

function renderBikeInterpolated(position) {

    const indexA = Math.floor(position);
    const indexB = Math.min(
        indexA + 1,
        BIKE_FRAME_COUNT - 1
    );

    const mix = position - indexA;


    const imgA = bikeFrames[indexA];
    const imgB = bikeFrames[indexB];


    if (!imgA || !imgB) return;


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawImageAlpha(imgA, 1 - mix);

    drawImageAlpha(imgB, mix);
}

(function loop() {


    if (mode === "main") {


        current += (target - current) * LERP;


        const frame = Math.round(current);


        if (frame >= 348 && frame <= 378) {

            bikeBtn.style.display = "block";

        } else {

            bikeBtn.style.display = "none";
        }


        renderFrame(
            Math.min(
                FRAME_COUNT - 1,
                Math.max(0, frame)
            )
        );

     }
    // } else if (mode === "bike") {
    //     //let bikeSpeed = 0.025;

    //     bikeCurrent +=
    //         (bikeTarget - bikeCurrent) * BIKE_LERP;


    //     renderFrame(
    //         Math.min(
    //             BIKE_FRAME_COUNT - 1,
    //             Math.round(bikeCurrent)
    //         )
    //     );


    //     // fin de la séquence vélo
    //     if (bikeCurrent >= BIKE_FRAME_COUNT - 1.1) {


    //         mode = "main";


    //         current = 378;
    //         target = 378;


    //     }

    // }
        else if (mode === "bike") {


        exitBikeBtn.style.display = "block";


        // lecture normale en boucle

        if (!bikeStopping) {
            bikeCurrent += BIKE_LERP;// * bikeDirection;

            if (bikeCurrent >= BIKE_END_FRAME +1) {
                bikeCurrent = BIKE_START_FRAME;
                // bikeDirection = -1;
            }

            // if (bikeCurrent <= BIKE_START_FRAME) {
            //     bikeCurrent = BIKE_START_FRAME;
            //     bikeDirection = 1;
            // }
        }


        // arrêt demandé
        else {

            // const distance = Math.abs(bikeCurrent - bikeExitFrame);

            // if(distance > 0.5){
            //     if(bikeCurrent < bikeExitFrame)
            //         bikeCurrent += BIKE_LERP;
            //     else
            //         bikeCurrent -= BIKE_LERP;
            // }

            // else {

            //     bikeCurrent = bikeExitFrame;

            //     mode="main";

            //     const mappedMain = bikeToMainFrame(bikeCurrent);
            //     current = mappedMain;
            //     target = mappedMain;

            //     bikeStopping=false;

            //     exitBikeBtn.style.display="none";

            //-------------------------------------------------
            
            // const distance = bikeStartFrame - bikeCurrent;
            // bikeCurrent += BIKE_LERP;

            // if (bikeCurrent > BIKE_END_FRAME) {
            //     bikeCurrent = BIKE_START_FRAME;
            // }

            // if (
            //     Math.round(bikeCurrent) === bikeExitFram
            // ) {

            //     mode = "main";

            //     const mappedMain = bikeToMainFrame(bikeExitFrame);

            //     current = mappedMain;
            //     target = mappedMain;

            //     bikeStopping = false;
            //     exitBikeBtn.style.display = "none";
            // }
            // -----------------------------------------------------------

            const distance = bikeStartFrame - bikeCurrent;

            if (Math.abs(distance) > 0.1) {

                bikeCurrent += Math.sign(distance) * BIKE_LERP;

            } else {

                bikeCurrent = bikeStartFrame;

                mode = "main";

                const mappedMain = bikeToMainFrame(bikeStartFrame);

                current = mappedMain;
                target = mappedMain;

                bikeStopping = false;
                exitBikeBtn.style.display = "none";
            }
            
        }

        renderFrame(
             Math.round(bikeCurrent)
        );

    }


    requestAnimationFrame(loop);


})();



// ────────────────────────────────────────
// RESIZE
window.addEventListener('resize', resizeCanvas);