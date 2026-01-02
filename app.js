const exprress = require('express');
const fs = require('fs');
const path = require('path');

const DB = path.join(__dirname, 'db.json');

const app = exprress();
app.use(exprress.json());
app.use(exprress.urlencoded({ extended: true }));
app.use(exprress.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
})

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});