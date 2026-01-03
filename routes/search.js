const express = require('express');
const https = require('https');
const router = express.Router();

// This API KEY is locked to a specific domain. 
// ww.joelmo.dev
const GEOAPIFY_API_KEY = 'ed2e5b9ec930495fb50f01d540c859b8';

router.get('/', (req, res) => {
    const query = (req.query.q || '').trim();
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&limit=10&apiKey=${GEOAPIFY_API_KEY}`;

    https
        .get(url, (response) => {
            let body = '';
            response.on('data', (chunk) => {
                body += chunk;
            });
            response.on('end', () => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    return res.status(502).json({ error: 'Upstream error' });
                }
                try {
                    const data = JSON.parse(body);
                    const results = (data.features || []).map(feature => ({
                        name: feature.properties.name || feature.properties.formatted || 'Unknown',
                        display_name: feature.properties.formatted || '',
                        lat: feature.properties.lat,
                        lon: feature.properties.lon
                    }));
                    res.json({ results });
                } catch (err) {
                    console.error('[SEARCH] Parse error:', err);
                    res.status(500).json({ error: 'Invalid upstream response' });
                }
            });
        })
        .on('error', (err) => {
            console.error('[SEARCH] Request error:', err);
            res.status(500).json({ error: 'Search failed' });
        });
});

module.exports = router;
