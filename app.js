require('dotenv').config();
const express = require('express');
const path = require('path');

const pixelsRouter = require('./routes/pixels');
const searchRouter = require('./routes/search');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use('/api/pixels', pixelsRouter);
app.use('/api/search', searchRouter);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});