import { selectedColor } from './paint.js';

const canvas = document.getElementById("grid-canvas");
const ctx = canvas.getContext("2d");

let currentMap = null;
const CHUNK_SIZE = 4;
const GRID_SIZE = 4;
const REFERENCE_ZOOM = 15;

let selectedPixels = [];
var paintMode = false;
let spaceKeyPressed = false;
let userId = null;
let lastPaintedPixel = null;
let eraseMode = false;

export function togglePaintMode() {
    paintMode = !paintMode;
}

export function setEraseMode(value) {
    eraseMode = value;
}

function getUserId() {
    if (!userId) {
        userId = localStorage.getItem('userId');
    }
    return userId;
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && paintMode && !spaceKeyPressed) {
        e.preventDefault();
        spaceKeyPressed = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        spaceKeyPressed = false;
        lastPaintedPixel = null;
    }
});

async function paintPixel(gridX, gridY, lat, lng, isClick = false) {
    if (!selectedColor || !paintMode) return;
    
    if (!isClick && !spaceKeyPressed) return;
    
    const key = `${gridX},${gridY}`;
    if (!isClick && lastPaintedPixel === key) return;
    
    if (!isClick) {
        lastPaintedPixel = key;
    }
    
    const pixelData = {
        gridX: gridX,
        gridY: gridY,
        lat: lat,
        lng: lng,
        color: selectedColor,
        userId: getUserId(),
        timestamp: Date.now()
    };
    
    try {
        const response = await fetch('/api/pixels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pixels: [pixelData] })
        });
        
        if (response.ok) {
            const result = await response.json();
            const newPixelMap = new Map();
            selectedPixels.forEach(p => {
                newPixelMap.set(`${p.gridX},${p.gridY}`, p);
            });
            result.savedPixels.forEach(p => {
                newPixelMap.set(`${p.gridX},${p.gridY}`, p);
            });
            selectedPixels = Array.from(newPixelMap.values());
            drawGrid();
        }
    } catch (error) {
        console.error('Error saving pixels:', error);
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
    
    loadVisiblePixels();
    
    map.on('moveend', loadVisiblePixels);
    map.on('zoomend', loadVisiblePixels);
}

async function loadVisiblePixels() {
    if (!currentMap) return;
    
    const bounds = currentMap.getBounds();
    const zoom = currentMap.getZoom();
    
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    const neGlobal = latLngToGlobalPixels(ne.lat, ne.lng);
    const swGlobal = latLngToGlobalPixels(sw.lat, sw.lng);
    
    const minX = Math.floor(swGlobal.x / GRID_SIZE) - 10;
    const maxX = Math.ceil(neGlobal.x / GRID_SIZE) + 10;
    const minY = Math.floor(neGlobal.y / GRID_SIZE) - 10;
    const maxY = Math.ceil(swGlobal.y / GRID_SIZE) + 10;
    
    try {
        const response = await fetch(
            `/api/pixels?minX=${minX}&maxX=${maxX}&minY=${minY}&maxY=${maxY}`
        );
        
        if (response.ok) {
            const data = await response.json();
            
            const newPixelMap = new Map();
            selectedPixels.forEach(p => {
                newPixelMap.set(`${p.gridX},${p.gridY}`, p);
            });
            
            data.pixels.forEach(p => {
                newPixelMap.set(`${p.gridX},${p.gridY}`, p);
            });
            
            selectedPixels = Array.from(newPixelMap.values());
            drawGrid();
        }
    } catch (error) {
        console.error('Error loading pixels:', error);
    }
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
    if (!currentMap || currentMap._animatingZoom || !paintMode) return;
    const rect = canvas.getBoundingClientRect();
    const zoom = currentMap.getZoom();
    const scale = Math.pow(2, zoom - REFERENCE_ZOOM);
    const center = currentMap.getCenter();
    const centerGlobal = latLngToGlobalPixels(center.lat, center.lng);

    const globalX = centerGlobal.x + (e.clientX - rect.left - canvas.width / 2) / scale;
    const globalY = centerGlobal.y + (e.clientY - rect.top - canvas.height / 2) / scale;

    const gridX = Math.floor(globalX / GRID_SIZE);
    const gridY = Math.floor(globalY / GRID_SIZE);

    const paintedPixel = selectedPixels.find(p => p.gridX === gridX && p.gridY === gridY);
    
    if (eraseMode) {
        if (paintedPixel) {
            erasePixel(gridX, gridY);
        }
        return;
    }
    
    if (paintedPixel && !eraseMode) {
        const coords = globalPixelsToLatLng(globalX, globalY);
        paintPixel(gridX, gridY, coords.lat, coords.lng, true);
    } else if (!paintedPixel) {
        const coords = globalPixelsToLatLng(globalX, globalY);
        paintPixel(gridX, gridY, coords.lat, coords.lng, true);
    }
}

async function erasePixel(gridX, gridY) {
    try {
        const response = await fetch(`/api/pixels/${gridX},${gridY}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            selectedPixels = selectedPixels.filter(p => !(p.gridX === gridX && p.gridY === gridY));
            drawGrid();
        } else {
            selectedPixels = selectedPixels.filter(p => !(p.gridX === gridX && p.gridY === gridY));
            drawGrid();
        }
    } catch (error) {
        console.error('Error erasing pixel:', error);
    }
}

function showPixelInfo(pixel, x, y) {
    const date = new Date(pixel.timestamp);
    const dateStr = date.toLocaleString('en-US');
    
    const oldTooltip = document.getElementById('pixel-tooltip');
    if (oldTooltip) oldTooltip.remove();
    
    const tooltip = document.createElement('div');
    tooltip.id = 'pixel-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.left = x + 10 + 'px';
    tooltip.style.top = y + 10 + 'px';
    tooltip.style.background = 'rgba(0, 0, 0, 0.85)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '6px';
    tooltip.style.fontSize = '13px';
    tooltip.style.zIndex = '10000';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.fontFamily = 'monospace';
    tooltip.innerHTML = `
        <div><strong>Painted by:</strong> ${pixel.userId}</div>
        <div><strong>When:</strong> ${dateStr}</div>
        <div><strong>Color:</strong> ${pixel.color}</div>
    `;
    
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
        tooltip.remove();
    }, 3000);
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
    
    if (spaceKeyPressed && paintMode) {
        const gridX = Math.floor(globalX / GRID_SIZE);
        const gridY = Math.floor(globalY / GRID_SIZE);
        const coords = globalPixelsToLatLng(globalX, globalY);
        paintPixel(gridX, gridY, coords.lat, coords.lng);
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
    
    const minGridX = Math.floor(topLeftGlobalX / GRID_SIZE);
    const maxGridX = Math.ceil(bottomRightGlobalX / GRID_SIZE);
    const minGridY = Math.floor(topLeftGlobalY / GRID_SIZE);
    const maxGridY = Math.ceil(bottomRightGlobalY / GRID_SIZE);
    
    selectedPixels.forEach(pixel => {
        if (pixel.gridX < minGridX || pixel.gridX > maxGridX ||
            pixel.gridY < minGridY || pixel.gridY > maxGridY) {
            return;
        }
        
        const cX = pixel.gridX * GRID_SIZE;
        const cY = pixel.gridY * GRID_SIZE;
        const sX = (cX - centerGlobal.x) * scale + screenCenterX;
        const sY = (cY - centerGlobal.y) * scale + screenCenterY;
        const size = GRID_SIZE * scale;

        const rgbColor = colorMap[pixel.color] || 'rgb(0, 100, 255)';
        ctx.fillStyle = rgbColor;
        ctx.fillRect(sX, sY, size, size);
        
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
        ctx.lineWidth = Math.max(0.3, scale * 0.15);
        ctx.strokeRect(sX, sY, size, size);
    });

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
