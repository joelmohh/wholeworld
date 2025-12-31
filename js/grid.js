import kaplay from "https://unpkg.com/kaplay@4000.0.0-alpha.24/dist/kaplay.mjs";

const k = kaplay({
    canvas: document.getElementById("grid-canvas"),
    background: [0, 0, 0, 0], // Mantém transparente para ver o mapa
    width: window.innerWidth,
    height: window.innerHeight,
});

// Configuração fixa do grid (aprox. 55 metros)
const GRID_SIZE_DEG = 0.0005;

export function drawGrid(map) {
    const zoom = map.getZoom();
    if (zoom < 15) return;

    const bounds = map.getBounds();
    const center = map.getCenter();
    
    // Sincroniza a câmera do KAPLAY com o centro do mapa (em pixels)
    const centerPoint = map.project(center, zoom);
    k.camPos(centerPoint.x, centerPoint.y);

    // Ajuste da longitude para manter quadrados perfeitos
    const cosLat = Math.cos(center.lat * Math.PI / 180);
    const sizeLng = GRID_SIZE_DEG / cosLat;

    // Âncoras fixas para o grid não deslizar
    const startLat = Math.floor(bounds.getSouth() / GRID_SIZE_DEG) * GRID_SIZE_DEG;
    const startLng = Math.floor(bounds.getWest() / sizeLng) * sizeLng;

    // Renderização das linhas verticais
    for (let lng = startLng; lng <= bounds.getEast() + sizeLng; lng += sizeLng) {
        const p1 = map.project([bounds.getNorth(), lng], zoom);
        const p2 = map.project([bounds.getSouth(), lng], zoom);
        k.drawLine({
            p1: k.vec2(p1.x, p1.y),
            p2: k.vec2(p2.x, p2.y),
            color: k.rgb(204, 204, 204), // #ccc
            opacity: 0.5,
            width: 1,
        });
    }

    // Renderização das linhas horizontais
    for (let lat = startLat; lat <= bounds.getNorth() + GRID_SIZE_DEG; lat += GRID_SIZE_DEG) {
        const p1 = map.project([lat, bounds.getWest()], zoom);
        const p2 = map.project([lat, bounds.getEast()], zoom);
        k.drawLine({
            p1: k.vec2(p1.x, p1.y),
            p2: k.vec2(p2.x, p2.y),
            color: k.rgb(204, 204, 204),
            opacity: 0.5,
            width: 1,
        });
    }
}

// Garante que o canvas do KAPLAY mude de tamanho com a janela
window.addEventListener("resize", () => {
    k.onResize(() => {
        k.width = window.innerWidth;
        k.height = window.innerHeight;
    });
});