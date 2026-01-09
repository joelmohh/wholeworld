const express = require('express');
const { MongoClient } = require('mongodb');

const router = express.Router();

const MONGO_URI = process.env.CONNECTION_STRING
const PIXELS_COLLECTION = 'pixels';

let cachedClient;
let cachedDb;

async function getDb() {
    if (cachedDb) {
        return cachedDb;
    }

    if (!MONGO_URI) {
        throw new Error('Missing MONGO_URI');
    }

    cachedClient = new MongoClient(MONGO_URI);
    await cachedClient.connect();
    cachedDb = cachedClient.db(DB_NAME);
    await cachedDb.collection(PIXELS_COLLECTION).createIndex({ key: 1 }, { unique: true });
    return cachedDb;
}

function normalizePixel(pixel) {
    const gridX = Number(pixel.gridX);
    const gridY = Number(pixel.gridY);

    if (Number.isNaN(gridX) || Number.isNaN(gridY)) {
        throw new Error('Invalid grid coordinates');
    }

    return {
        key: `${gridX},${gridY}`,
        gridX,
        gridY,
        lat: Number(pixel.lat),
        lng: Number(pixel.lng),
        color: pixel.color,
        userId: pixel.userId,
        timestamp: pixel.timestamp ? Number(pixel.timestamp) : Date.now()
    };
}

router.post('/', async (req, res) => {
    try {
        const { pixels } = req.body;

        if (!Array.isArray(pixels) || pixels.length === 0) {
            return res.status(400).json({ error: 'Invalid pixels data' });
        }

        const db = await getDb();
        const collection = db.collection(PIXELS_COLLECTION);

        const docs = pixels.map(normalizePixel);
        const operations = docs.map(doc => ({
            updateOne: {
                filter: { key: doc.key },
                update: { $set: doc },
                upsert: true
            }
        }));

        if (operations.length) {
            await collection.bulkWrite(operations, { ordered: false });
        }

        res.json({ success: true, savedPixels: docs });
    } catch (error) {
        console.error('Error saving pixels:', error);
        res.status(500).json({ error: 'Failed to save pixels' });
    }
});

router.delete('/:key', async (req, res) => {
    try {
        const key = req.params.key;

        if (!key) {
            return res.status(400).json({ error: 'Missing pixel key' });
        }

        const db = await getDb();
        const collection = db.collection(PIXELS_COLLECTION);
        const result = await collection.deleteOne({ key });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Pixel not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting pixel:', error);
        res.status(500).json({ error: 'Failed to delete pixel' });
    }
});

router.get('/', async (req, res) => {
    try {
        const { minX, maxX, minY, maxY } = req.query;
        const db = await getDb();
        const collection = db.collection(PIXELS_COLLECTION);

        const hasBounds = [minX, maxX, minY, maxY].every(v => v !== undefined);
        const query = {};

        if (hasBounds) {
            const xMin = Number(minX);
            const xMax = Number(maxX);
            const yMin = Number(minY);
            const yMax = Number(maxY);

            if ([xMin, xMax, yMin, yMax].some(Number.isNaN)) {
                return res.status(400).json({ error: 'Invalid bounds' });
            }

            query.gridX = { $gte: xMin, $lte: xMax };
            query.gridY = { $gte: yMin, $lte: yMax };
        }

        const pixels = await collection.find(query).toArray();
        res.json({ pixels });
    } catch (error) {
        console.error('Error loading pixels:', error);
        res.status(500).json({ error: 'Failed to load pixels' });
    }
});

router.get('/leaderboard', async (req, res) => {
    try {
        const db = await getDb();
        const collection = db.collection(PIXELS_COLLECTION);

        const leaderboard = await collection.aggregate([
            { $match: { userId: { $exists: true, $ne: null } } },
            { $group: { _id: '$userId', pixelsPainted: { $sum: 1 } } },
            { $sort: { pixelsPainted: -1 } },
            { $limit: 50 },
            { $project: { _id: 0, userId: '$_id', pixelsPainted: 1 } }
        ]).toArray();

        res.json({ leaderboard });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        res.status(500).json({ error: 'Failed to load leaderboard' });
    }
});

module.exports = router;
