import { initGrid, drawGrid } from './grid.js';

var map = L.map('map', {
    zoomControl: false,
    minZoom: 3,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0,
    attributionControl: false,
    zoomSnap: 0
}).setView([0, 0], 16);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 20,
}).addTo(map);

var mapMarker = L.divIcon({
    className: 'map-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

var markerPlayer = L.marker([0, 0], { icon: mapMarker }).addTo(map).bindPopup("Você está aqui!");

function getUserLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            markerPlayer.setLatLng([lat, lng]);
            map.setView([lat, lng], 16);
        },
        null,
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    document.querySelector('.circle').classList.add('current');
}
getUserLocation();

initGrid(map);

map.on('zoomstart', () => {
    document.getElementById('grid-canvas').style.transition = 'transform 0.25s cubic-bezier(0,0,0.25,1)';
});

map.on('zoomanim', (e) => {
    const canvas = document.getElementById('grid-canvas');
    const scale = map.getZoomScale(e.zoom, map.getZoom());
    const offset = map._getCenterOffset(e.center).divideBy(1 - 1 / scale);
    canvas.style.transformOrigin = `${offset.x + canvas.width / 2}px ${offset.y + canvas.height / 2}px`;
    canvas.style.transform = `scale(${scale})`;
});

map.on('moveend zoomend viewreset', () => {
    const canvas = document.getElementById('grid-canvas');
    canvas.style.transition = 'none';
    canvas.style.transform = 'none';
    drawGrid();
});

map.on('move', () => {
    if (!map._animatingZoom) drawGrid();
    if (map.getCenter().distanceTo(markerPlayer.getLatLng()) > 1) {
        document.querySelector('.circle').classList.remove('current');
    } else {
        document.querySelector('.circle').classList.add('current');
    }
});

document.getElementById('zoom-in-btn').addEventListener('click', () => {
    map.zoomIn();
});

document.getElementById('zoom-out-btn').addEventListener('click', () => {
    map.zoomOut();
});

document.getElementById('center-btn').addEventListener('click', () => {
    map.setView(markerPlayer.getLatLng(), 16, { animate: true });
});