import { selectedColor as getSelectedColor } from './paint.js';

const canvas = document.getElementById("grid-canvas");
const ctx = canvas.getContext("2d");

let currentMap = null;
const CHUNK_SIZE = 4;
const GRID_SIZE = 4;
const REFERENCE_ZOOM = 15;

let selectedPixels = []
var paintMode = false;
export function tooglePaintMode() {
    if(paintMode){
        paintMode = false;
    } else {
        paintMode = true;
    }
}

const colorMap = {
    red: 'rgb(255, 0, 0)',
    crimson: 'rgb(220, 20, 60)',
    rose: 'rgb(255, 102, 178)',
    pink: 'rgb(255, 192, 203)',
    fuchsia: 'rgb(255, 0, 255)',
    magenta: 'rgb(255, 0, 255)',
    purple: 'rgb(128, 0, 128)',
    violet: 'rgb(238, 130, 238)',
    indigo: 'rgb(75, 0, 130)',
    blue: 'rgb(0, 0, 255)',
    sky: 'rgb(135, 206, 235)',
    cyan: 'rgb(0, 255, 255)',
    teal: 'rgb(0, 128, 128)',
    emerald: 'rgb(80, 200, 120)',
    green: 'rgb(0, 128, 0)',
    lime: 'rgb(0, 255, 0)',
    chartreuse: 'rgb(127, 255, 0)',
    yellow: 'rgb(255, 255, 0)',
    amber: 'rgb(255, 191, 0)',
    orange: 'rgb(255, 165, 0)',
    coral: 'rgb(255, 127, 80)',
    tomato: 'rgb(255, 99, 71)',
    salmon: 'rgb(250, 128, 114)',
    peach: 'rgb(255, 218, 185)',
    brown: 'rgb(165, 42, 42)',
    chocolate: 'rgb(210, 105, 30)',
    sienna: 'rgb(160, 82, 45)',
    tan: 'rgb(210, 180, 140)',
    khaki: 'rgb(240, 230, 200)',
    olive: 'rgb(128, 128, 0)',
    gold: 'rgb(255, 215, 0)',
    silver: 'rgb(192, 192, 192)',
    white: 'rgb(255, 255, 255)',
    lightgray: 'rgb(211, 211, 211)',
    gray: 'rgb(128, 128, 128)',
    darkgray: 'rgb(169, 169, 169)',
    slate: 'rgb(112, 128, 144)',
    charcoal: 'rgb(54, 54, 54)',
    black: 'rgb(0, 0, 0)',
    navy: 'rgb(0, 0, 128)',
    maroon: 'rgb(128, 0, 0)',
    burgundy: 'rgb(128, 0, 32)',
    plum: 'rgb(221, 160, 221)',
    lavender: 'rgb(230, 230, 250)',
    mint: 'rgb(152, 251, 152)',
    aqua: 'rgb(0, 255, 255)',
    turquoise: 'rgb(64, 224, 208)',
    steel: 'rgb(70, 130, 180)',
    ivory: 'rgb(255, 255, 240)'
};

let hoveredChunk = null;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (currentMap) drawGrid();
}

export function initGrid(map) {
    currentMap = map;
    resizeCanvas();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('click', onClick);
    window.addEventListener('resize', resizeCanvas);
}

function latLngToGlobalPixels(lat, lng) {
    const worldSize = 256 * Math.pow(2, REFERENCE_ZOOM);
    const x = ((lng + 180) / 360) * worldSize;
    const y = ((1 - Math.log(Math.tan((lat * Math.PI / 180)) + 1 / Math.cos((lat * Math.PI / 180))) / Math.PI) / 2) * worldSize;
    return { x, y };
}
function globalPixelsToLatLng(x, y) {
    const worldSize = 256 * Math.pow(2, REFERENCE_ZOOM);
    const lng = (x / worldSize) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * y) / worldSize;
    const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
    return { lat, lng };
}

function onClick(e) {
    if (!currentMap || currentMap._animatingZoom) return;
    const rect = canvas.getBoundingClientRect();
    const zoom = currentMap.getZoom();
    const scale = Math.pow(2, zoom - REFERENCE_ZOOM);
    const center = currentMap.getCenter();
    const centerGlobal = latLngToGlobalPixels(center.lat, center.lng);

    // Global pixel coordinates of the click
    const globalX = centerGlobal.x + (e.clientX - rect.left - canvas.width / 2) / scale;
    const globalY = centerGlobal.y + (e.clientY - rect.top - canvas.height / 2) / scale;

    // Grid coordinates
    const gridX = Math.floor(globalX / GRID_SIZE);
    const gridY = Math.floor(globalY / GRID_SIZE);

    const coords = globalPixelsToLatLng(globalX, globalY);

    selectedPixels.push({ gridX, gridY, lat: coords.lat, lng: coords.lng, color: getSelectedColor });
    console.log("Selected Pixels:", selectedPixels);

}

function onMouseMove(e) {
    if (!currentMap || currentMap._animatingZoom) return;
    const rect = canvas.getBoundingClientRect();
    const zoom = currentMap.getZoom();
    const scale = Math.pow(2, zoom - REFERENCE_ZOOM);
    const center = currentMap.getCenter();
    const centerGlobal = latLngToGlobalPixels(center.lat, center.lng);

    const globalX = centerGlobal.x + (e.clientX - rect.left - canvas.width / 2) / scale;
    const globalY = centerGlobal.y + (e.clientY - rect.top - canvas.height / 2) / scale;

    const chunkX = Math.floor(globalX / CHUNK_SIZE);
    const chunkY = Math.floor(globalY / CHUNK_SIZE);

    if (!hoveredChunk || hoveredChunk.chunkX !== chunkX || hoveredChunk.chunkY !== chunkY) {
        hoveredChunk = { chunkX, chunkY };
        drawGrid();
    }
}

function onMouseLeave() {
    hoveredChunk = null;
    drawGrid();
}

export function drawGrid() {
    if (!currentMap) return;

    const zoom = currentMap.getZoom();
    const center = currentMap.getCenter();

    if (zoom < 14.5) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.pow(2, zoom - REFERENCE_ZOOM);
    const centerGlobal = latLngToGlobalPixels(center.lat, center.lng);

    const screenCenterX = canvas.width / 2;
    const screenCenterY = canvas.height / 2;

    const topLeftGlobalX = centerGlobal.x - screenCenterX / scale;
    const topLeftGlobalY = centerGlobal.y - screenCenterY / scale;
    const bottomRightGlobalX = centerGlobal.x + screenCenterX / scale;
    const bottomRightGlobalY = centerGlobal.y + screenCenterY / scale;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(100, 150, 255, 0)';
    ctx.lineWidth = Math.max(0.5, scale * 0.4);

    const startGridX = Math.floor(topLeftGlobalX / GRID_SIZE) * GRID_SIZE;
    for (let gX = startGridX; gX <= bottomRightGlobalX; gX += GRID_SIZE) {
        const sX = (gX - centerGlobal.x) * scale + screenCenterX;
        ctx.moveTo(sX, 0);
        ctx.lineTo(sX, canvas.height);
    }

    const startGridY = Math.floor(topLeftGlobalY / GRID_SIZE) * GRID_SIZE;
    for (let gY = startGridY; gY <= bottomRightGlobalY; gY += GRID_SIZE) {
        const sY = (gY - centerGlobal.y) * scale + screenCenterY;
        ctx.moveTo(0, sY);
        ctx.lineTo(canvas.width, sY);
    }
    ctx.stroke();
    if (paintMode) {
        selectedPixels.forEach(pixel => {
            const cX = pixel.gridX * GRID_SIZE;
            const cY = pixel.gridY * GRID_SIZE;
            const sX = (cX - centerGlobal.x) * scale + screenCenterX;
            const sY = (cY - centerGlobal.y) * scale + screenCenterY;
            const size = GRID_SIZE * scale;

            const rgbColor = colorMap[pixel.color] || 'rgb(0, 100, 255)';
            ctx.fillStyle = rgbColor;
            ctx.fillRect(sX, sY, size, size);
        });
    }

    if (hoveredChunk) {
        const cX = hoveredChunk.chunkX * CHUNK_SIZE;
        const cY = hoveredChunk.chunkY * CHUNK_SIZE;
        const sX = (cX - centerGlobal.x) * scale + screenCenterX;
        const sY = (cY - centerGlobal.y) * scale + screenCenterY;
        const size = CHUNK_SIZE * scale;

        ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
        ctx.fillRect(sX, sY, size, size);
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(sX, sY, size, size);
    }
}