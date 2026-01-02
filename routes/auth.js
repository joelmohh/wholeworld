const express = require('express');
const router = express.Router();

router.get('/callback', (req, res) => {
    try {
        const code = req.query.code;
        // Handle the OAuth callback logic here
        res.send(`Received code: ${code}`);
    } catch (error) {
        res.status(500).send('Error processing callback');
    }
});



module.exports = router;