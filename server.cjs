const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = 'products.json';

// Obtener productos
app.get('/products', (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } else {
        res.json([]);
    }
});

// Guardar productos
app.post('/products', (req, res) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ status: 'ok' });
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`)); 