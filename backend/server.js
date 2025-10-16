const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const db = new sqlite3.Database('./market.db', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        image_url TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        price INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id)
    )`);
    const stmt = db.prepare("INSERT OR IGNORE INTO items (name) VALUES (?)");
    stmt.run("ポーション");
    stmt.run("ハイポーション");
    stmt.run("エリクサー");
    stmt.finalize();
});

// ... GETリクエストのエンドポイントは変更なし ...
app.get('/api/items', (req, res) => {
    const sql = `
      SELECT
        i.id, i.name, i.image_url,
        AVG(p.price) as average_price,
        MIN(p.price) as min_price,
        MAX(p.price) as max_price,
        COUNT(p.price) as trade_count
      FROM items i
      LEFT JOIN prices p ON i.id = p.item_id
      WHERE i.name IS NOT NULL AND i.name != ''
      GROUP BY i.id
      ORDER BY i.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) res.status(500).json({ "error": err.message });
        else res.json(rows);
    });
});

app.get('/api/items/:id', (req, res) => {
    const itemId = req.params.id;
    const getItemDetails = new Promise((resolve, reject) => {
        const sql = `
        SELECT
            i.id, i.name, i.image_url,
            AVG(p.price) as average_price,
            MIN(p.price) as min_price,
            MAX(p.price) as max_price,
            COUNT(p.price) as trade_count
        FROM items i
        LEFT JOIN prices p ON i.id = p.item_id
        WHERE i.id = ?
        GROUP BY i.id`;
        db.get(sql, [itemId], (err, row) => err ? reject(err) : resolve(row));
    });
    const getPriceHistory = new Promise((resolve, reject) => {
        const sql = `
        SELECT price, created_at
        FROM prices
        WHERE item_id = ?
        ORDER BY created_at DESC`;
        db.all(sql, [itemId], (err, rows) => err ? reject(err) : resolve(rows));
    });
    Promise.all([getItemDetails, getPriceHistory])
        .then(([details, history]) => {
            if (!details) res.status(404).json({ "error": "Item not found" });
            else res.json({ details, history });
        })
        .catch(err => res.status(500).json({ "error": err.message }));
});


// [POST] /api/items : 新しいアイテムの追加
app.post('/api/items', upload.single('image'), (req, res) => {
    // ★★★ ここを修正 ★★★
    // req.bodyが存在しない、または空の場合のエラーハンドリングを追加
    if (!req.body) {
        return res.status(400).json({ "error": "Invalid request: no body received." });
    }

    const { name } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || name.trim() === '') {
        return res.status(400).json({ "error": "Item name is required." });
    }

    const sql = 'INSERT INTO items (name, image_url) VALUES (?, ?)';
    db.run(sql, [name.trim(), imageUrl], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ "error": "This item already exists." });
            }
            return res.status(500).json({ "error": err.message });
        }
        res.status(201).json({ "message": "Item added successfully", "id": this.lastID });
    });
});

// [POST] /api/prices : 価格の追加
app.post('/api/prices', (req, res) => {
    const { itemId, price } = req.body;
    if (!itemId || !price || price <= 0) {
        return res.status(400).json({ "error": "Invalid input data." });
    }
    const sql = 'INSERT INTO prices (item_id, price) VALUES (?, ?)';
    db.run(sql, [itemId, price], function (err) {
        if (err) res.status(500).json({ "error": err.message });
        else res.status(201).json({ "message": "Success", "id": this.lastID });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

