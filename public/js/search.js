document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.querySelector('.search-location button');
    if (!searchBtn) return;

    searchBtn.addEventListener('click', () => {
        openSearchModal();
    });
});

function openSearchModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'searchModal';

    const content = document.createElement('div');
    content.className = 'modal-content';

    content.innerHTML = `
        <div class="modal-header">
            <h2>Search Location</h2>
            <button id="closeSearchModal" class="close-button"><i class="fas fa-times"></i></button>
        </div>
        <input type="text" id="locationInput" placeholder="Enter location name..." />
        <button id="searchLocationBtn" class="btn btn-primary">Search</button>
        <div id="searchResults"></div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    const closeBtn = document.getElementById('closeSearchModal');
    const searchBtn = document.getElementById('searchLocationBtn');
    const locationInput = document.getElementById('locationInput');

    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchLocation();
        }
    });

    searchBtn.addEventListener('click', searchLocation);

    async function searchLocation() {
        const query = locationInput.value.trim();
        if (!query) return;

        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = '<p>Searching...</p>';

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            const results = data.results || [];

            if (results.length === 0) {
                resultsDiv.innerHTML = '<p>No results found</p>';
                return;
            }

            let html = '';
            results.forEach(result => {
                html += `
                    <div class="search-result-item" onclick="goToLocation(${result.lat}, ${result.lon})">
                        <strong>${result.name}</strong>
                        <p>${result.display_name}</p>
                    </div>
                `;
            });
            resultsDiv.innerHTML = html;
        } catch (error) {
            console.error('Search error:', error);
            resultsDiv.innerHTML = '<p>Error searching location</p>';
        }
    }
}

function goToLocation(lat, lon) {
    if (!window.map) {
        console.error('Map not available');
        return;
    }

    window.map.setView([lat, lon], 16, { animate: true });

    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.remove();
    }
}

window.goToLocation = goToLocation;
