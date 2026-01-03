const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const PIXELS_DB = path.join(__dirname, '..', 'pixels.json');

if (!fs.existsSync(PIXELS_DB)) {
    fs.writeFileSync(PIXELS_DB, JSON.stringify({ pixels: {} }));
}

router.post('/', (req, res) => {
    try {
        const { pixels } = req.body;
        if (!pixels || !Array.isArray(pixels)) {
            return res.status(400).json({ error: 'Invalid pixels data' });
        }

        const data = JSON.parse(fs.readFileSync(PIXELS_DB, 'utf8'));
        const savedPixels = [];

        pixels.forEach(pixel => {
            const key = `${pixel.gridX},${pixel.gridY}`;
            data.pixels[key] = {
                gridX: pixel.gridX,
                gridY: pixel.gridY,
                lat: pixel.lat,
                lng: pixel.lng,
                color: pixel.color,
                userId: pixel.userId,
                timestamp: pixel.timestamp
            };
            savedPixels.push(data.pixels[key]);
        });

        fs.writeFileSync(PIXELS_DB, JSON.stringify(data, null, 2));
        res.json({ success: true, savedPixels });
    } catch (error) {
        console.error('Error saving pixels:', error);
        res.status(500).json({ error: 'Failed to save pixels' });
    }
});

router.delete('/:key', (req, res) => {
    try {
        const key = req.params.key;
        const data = JSON.parse(fs.readFileSync(PIXELS_DB, 'utf8'));
        
        if (data.pixels[key]) {
            delete data.pixels[key];
            fs.writeFileSync(PIXELS_DB, JSON.stringify(data, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Pixel not found' });
        }
    } catch (error) {
        console.error('Error deleting pixel:', error);
        res.status(500).json({ error: 'Failed to delete pixel' });
    }
});




router.get('/', (req, res) => {
    try {
        const { minX, maxX, minY, maxY } = req.query;
        const data = JSON.parse(fs.readFileSync(PIXELS_DB, 'utf8'));
        
        if (!data.pixels) {
            data.pixels = {};
            fs.writeFileSync(PIXELS_DB, JSON.stringify(data, null, 2));
        }
        
        if (!minX || !maxX || !minY || !maxY) {
            return res.json({ pixels: Object.values(data.pixels) });
        }

        const visiblePixels = Object.values(data.pixels).filter(pixel => {
            return pixel.gridX >= parseInt(minX) && pixel.gridX <= parseInt(maxX) &&
                   pixel.gridY >= parseInt(minY) && pixel.gridY <= parseInt(maxY);
        });

        res.json({ pixels: visiblePixels });
    } catch (error) {
        console.error('Error loading pixels:', error);
        res.status(500).json({ error: 'Failed to load pixels' });
    }
});

router.get('/leaderboard', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(PIXELS_DB, 'utf8'));
        
        if (!data.pixels) {
            data.pixels = {};
            fs.writeFileSync(PIXELS_DB, JSON.stringify(data, null, 2));
        }
        
        const userStats = {};

        Object.values(data.pixels).forEach(pixel => {
            if (!userStats[pixel.userId]) {
                userStats[pixel.userId] = 0;
            }
            userStats[pixel.userId]++;
        });

        const leaderboard = Object.entries(userStats)
            .map(([userId, count]) => ({ userId, pixelsPainted: count }))
            .sort((a, b) => b.pixelsPainted - a.pixelsPainted)
            .slice(0, 50);

        res.json({ leaderboard });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        res.status(500).json({ error: 'Failed to load leaderboard' });
    }
});

module.exports = router;
