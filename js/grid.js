import kaplay from "https://unpkg.com/kaplay@4000.0.0-alpha.24/dist/kaplay.mjs";
const k = kaplay({
    canvas: document.getElementById("grid-canvas"),
    background: [0, 0, 0, 0], 
    width: window.innerWidth,
    height: window.innerHeight,
});

export function drawGrid(zoom) {
    k.clear();
}