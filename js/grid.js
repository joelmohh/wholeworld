const canvas = document.getElementById("grid-canvas");
const ctx = canvas.getContext("2d");

let currentMap = null;
const CHUNK_SIZE = 4; 
const GRID_SIZE = 4; 
const REFERENCE_ZOOM = 15; 

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
    window.addEventListener('resize', resizeCanvas);
}

function latLngToGlobalPixels(lat, lng) {
    const worldSize = 256 * Math.pow(2, REFERENCE_ZOOM);
    const x = ((lng + 180) / 360) * worldSize;
    const y = ((1 - Math.log(Math.tan((lat * Math.PI / 180)) + 1 / Math.cos((lat * Math.PI / 180))) / Math.PI) / 2) * worldSize;
    return { x, y };
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