        var limitesDoMundo = [
            [-85, -180], 
            [85, 180]    
        ];

        var map = L.map('map', {
            minZoom: 3,       
            maxBounds: [[-85, -180], [85, 180]], 
            maxBoundsViscosity: 1.0,   
            attributionControl: false
        }).setView([-23.5505, -46.6333], 16);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 20,
            // noWrap: true // Opcional: Se quiser que o mapa não se repita horizontalmente
        }).addTo(map);