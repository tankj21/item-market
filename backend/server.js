const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// データベースの作成
const db = new sqlite3.Database('market.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        price INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id)
    )`);

    // 初期データの挿入
    const stmt = db.prepare("INSERT OR IGNORE INTO items (name) VALUES (?)");
    stmt.run("ポーション");
    stmt.run("ハイポーション");
    stmt.run("エリクサー");
    stmt.finalize();
});

// [GET] /api/items : 全アイテムの相場情報を取得
app.get('/api/items', (req, res) => {
    // 改善: nameが空やNULLのアイテムは結果に含めないようにする
    const sql = `
      SELECT
        i.id,
        i.name,
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
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// [GET] /api/items/:id : 特定のアイテムの詳細と価格履歴を取得
app.get('/api/items/:id', (req, res) => {
    const itemId = req.params.id;

    const getItemDetails = new Promise((resolve, reject) => {
        const sql = `
        SELECT
            i.id,
            i.name,
            AVG(p.price) as average_price,
            MIN(p.price) as min_price,
            MAX(p.price) as max_price,
            COUNT(p.price) as trade_count
        FROM items i
        LEFT JOIN prices p ON i.id = p.item_id
        WHERE i.id = ?
        GROUP BY i.id
        `;
        db.get(sql, [itemId], (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });

    const getPriceHistory = new Promise((resolve, reject) => {
        const sql = `
        SELECT price, created_at
        FROM prices
        WHERE item_id = ?
        ORDER BY created_at DESC
        `;
        db.all(sql, [itemId], (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });

    Promise.all([getItemDetails, getPriceHistory])
        .then(([details, history]) => {
            if (!details) {
                return res.status(404).json({ "error": "Item not found" });
            }
            res.json({ details, history });
        })
        .catch(err => {
            res.status(500).json({ "error": err.message });
        });
});


// [POST] /api/items : 新しいアイテムの追加
app.post('/api/items', (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === '') { // バリデーションを強化
        return res.status(400).json({ "error": "Item name is required." });
    }

    const sql = 'INSERT INTO items (name) VALUES (?)';
    db.run(sql, [name.trim()], function (err) {
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
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.status(201).json({ "message": "Success", "id": this.lastID });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

