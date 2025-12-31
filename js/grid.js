const canvas = document.getElementById("grid-canvas");
const ctx = canvas.getContext("2d");

let currentMap = null;

const CHUNK_SIZE = 16; 
const GRID_SIZE = 16; 
const REFERENCE_ZOOM = 15; 

const chunkCache = new Map();

let hoveredChunk = null;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (currentMap) {
        drawGrid();
    }
}

export function initGrid(map) {
    currentMap = map;
    resizeCanvas();
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    
    window.addEventListener('resize', resizeCanvas);
}

function getChunkKey(chunkX, chunkY) {
    return `${chunkX},${chunkY}`;
}

function getOrCreateChunk(chunkX, chunkY) {
    const key = getChunkKey(chunkX, chunkY);
    if (!chunkCache.has(key)) {
        chunkCache.set(key, {
            x: chunkX,
            y: chunkY,
            data: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE) 
        });
    }
    return chunkCache.get(key);
}

function getChunkCoords(pixelX, pixelY) {
    return {
        chunkX: Math.floor(pixelX / CHUNK_SIZE),
        chunkY: Math.floor(pixelY / CHUNK_SIZE),
        localX: pixelX % CHUNK_SIZE,
        localY: pixelY % CHUNK_SIZE
    };
}

function latLngToGlobalPixels(lat, lng) {
    const zoom = REFERENCE_ZOOM;
    const worldSize = 256 * Math.pow(2, zoom);
    
    const x = ((lng + 180) / 360) * worldSize;
    const y = ((1 - Math.log(Math.tan((lat * Math.PI / 180)) + 1 / Math.cos((lat * Math.PI / 180))) / Math.PI) / 2) * worldSize;
    
    return { x, y };
}

function globalPixelsToScreenPixels(globalX, globalY) {
    const zoom = currentMap.getZoom();
    const scale = Math.pow(2, zoom - REFERENCE_ZOOM);
    
    const center = currentMap.getCenter();
    const centerGlobal = latLngToGlobalPixels(center.lat, center.lng);
    
    const screenX = (globalX - centerGlobal.x) * scale + canvas.width / 2;
    const screenY = (globalY - centerGlobal.y) * scale + canvas.height / 2;
    
    return { x: screenX, y: screenY };
}

function screenPixelsToGlobalPixels(screenX, screenY) {
    const zoom = currentMap.getZoom();
    const scale = Math.pow(2, zoom - REFERENCE_ZOOM);
    
    const center = currentMap.getCenter();
    const centerGlobal = latLngToGlobalPixels(center.lat, center.lng);
    
    const globalX = centerGlobal.x + (screenX - canvas.width / 2) / scale;
    const globalY = centerGlobal.y + (screenY - canvas.height / 2) / scale;
    
    return { x: globalX, y: globalY };
}

function onMouseMove(e) {
    if (!currentMap) return;
    
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    const global = screenPixelsToGlobalPixels(screenX, screenY);
    const chunkX = Math.floor(global.x / CHUNK_SIZE);
    const chunkY = Math.floor(global.y / CHUNK_SIZE);
    
    if (!hoveredChunk || hoveredChunk.chunkX !== chunkX || hoveredChunk.chunkY !== chunkY) {
        hoveredChunk = { chunkX, chunkY };
        drawGrid();
    }
}

function onMouseLeave() {
    if (hoveredChunk) {
        hoveredChunk = null;
        drawGrid();
    }
}

export function drawGrid() {
    if (!currentMap) return;

    const zoom = currentMap.getZoom();
    
    if (zoom < 15) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cameraWidth = canvas.width;
    const cameraHeight = canvas.height;
    
    const scale = Math.pow(2, zoom - REFERENCE_ZOOM);
    
    const center = currentMap.getCenter();
    const centerGlobal = latLngToGlobalPixels(center.lat, center.lng);
    
    const topLeftGlobalX = centerGlobal.x - (cameraWidth / 2) / scale;
    const topLeftGlobalY = centerGlobal.y - (cameraHeight / 2) / scale;
    
    const screenCenterX = canvas.width / 2;
    const screenCenterY = canvas.height / 2;
    const viewWidthGlobal = cameraWidth / scale;
    const viewHeightGlobal = cameraHeight / scale;
    
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    const startGridX = Math.floor(topLeftGlobalX / GRID_SIZE) * GRID_SIZE;
    for (let globalX = startGridX; globalX < topLeftGlobalX + viewWidthGlobal; globalX += GRID_SIZE) {
        const screenX = (globalX - centerGlobal.x) * scale + screenCenterX;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, cameraHeight);
        ctx.stroke();
    }
    
    const startGridY = Math.floor(topLeftGlobalY / GRID_SIZE) * GRID_SIZE;
    for (let globalY = startGridY; globalY < topLeftGlobalY + viewHeightGlobal; globalY += GRID_SIZE) {
        const screenY = (globalY - centerGlobal.y) * scale + screenCenterY;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(cameraWidth, screenY);
        ctx.stroke();
    }
    if (hoveredChunk) {
        const chunkX = hoveredChunk.chunkX * CHUNK_SIZE;
        const chunkY = hoveredChunk.chunkY * CHUNK_SIZE;
        
        const screenTopLeftX = (chunkX - centerGlobal.x) * scale + screenCenterX;
        const screenTopLeftY = (chunkY - centerGlobal.y) * scale + screenCenterY;
        const screenBottomRightX = (chunkX + CHUNK_SIZE - centerGlobal.x) * scale + screenCenterX;
        const screenBottomRightY = (chunkY + CHUNK_SIZE - centerGlobal.y) * scale + screenCenterY;
        
        const width = screenBottomRightX - screenTopLeftX;
        const height = screenBottomRightY - screenTopLeftY;
        
        ctx.fillStyle = 'rgba(0, 100, 255, 0.8)';
        ctx.fillRect(screenTopLeftX, screenTopLeftY, width, height);
        
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(0, 100, 255, 1)';
        ctx.lineWidth = 3;
        ctx.strokeRect(screenTopLeftX, screenTopLeftY, width, height);
    }
}