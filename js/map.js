import { initGrid, drawGrid } from './grid.js';

var map = L.map('map', {
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

    if (!navigator.geolocation) {
        return { success: false, message: "Geolocation not supported" }
    }
    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    }
    function success(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        markerPlayer.setLatLng([lat, lng]);
        map.setView([lat, lng], 16);

    }
    function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        return { success: false, message: err.message }
    }

    navigator.geolocation.getCurrentPosition(success, error, options);

}
getUserLocation();

const maxZoom = 15

map.on('zoomend', function () {
    var currentZoom = map.getZoom();
    var element = markerPlayer.getElement();

    if (element) {
        if (currentZoom < maxZoom) {
            element.classList.add('marker-hidden');
        } else {
            element.classList.remove('marker-hidden');
        }
    }
});

initGrid(map);

map.on('move zoom moveend zoomend', () => {
    drawGrid();
});

const centerBtn = document.getElementById('center-btn');

centerBtn.addEventListener('click', () => {
    const currentPos = markerPlayer.getLatLng();
    
    map.setView(currentPos, 16, {
        animate: true,
        pan: {
            duration: 1
        }
    });
});