const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const dbPath = path.join(process.env.RENDER_DISK_PATH || '.', 'market.db');

// --- Middleware Settings ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- Database Connection & Setup ---
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

// --- Table Creation ---
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
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS item_tags (
        item_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (item_id, tag_id),
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )`);

    const tags = ['武器', '防具', '道具', '素材', '薬品', 'その他'];
    const tagStmt = db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)");
    tags.forEach(tag => tagStmt.run(tag));
    tagStmt.finalize();
});

// --- API Endpoints ---

// [GET] /api/tags : Get all available tags
app.get('/api/tags', (req, res) => {
    db.all("SELECT * FROM tags ORDER BY id", [], (err, rows) => {
        if (err) res.status(500).json({ "error": err.message });
        else res.json(rows);
    });
});

// [GET] /api/items : Get items, with filtering by tags
app.get('/api/items', (req, res) => {
    const { tags } = req.query;
    let sql = `
      SELECT
        i.id, i.name, i.image_url,
        AVG(p.price) as average_price,
        MIN(p.price) as min_price,
        MAX(p.price) as max_price,
        COUNT(p.price) as trade_count,
        (SELECT GROUP_CONCAT(t.name) FROM tags t JOIN item_tags it ON t.id = it.tag_id WHERE it.item_id = i.id) as tags
      FROM items i
      LEFT JOIN prices p ON i.id = p.item_id
    `;
    const params = [];

    if (tags) {
        const tagIds = tags.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (tagIds.length > 0) {
            sql += `
              WHERE i.id IN (
                SELECT item_id FROM item_tags WHERE tag_id IN (${tagIds.map(() => '?').join(',')})
              )
            `;
            params.push(...tagIds);
        }
    }
    
    sql += ` GROUP BY i.id ORDER BY i.id `;
    db.all(sql, params, (err, rows) => {
        if (err) res.status(500).json({ "error": err.message });
        else res.json(rows);
    });
});

// ★★★ [GET] /api/items/:id : This part was previously omitted. ★★★
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


// [POST] /api/items : Add a new item with tags
app.post('/api/items', upload.single('image'), (req, res) => {
    if (!req.body) {
        return res.status(400).json({ "error": "Invalid request: no body received." });
    }
    const { name, tags } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!name || name.trim() === '') {
        return res.status(400).json({ "error": "Item name is required." });
    }
    const insertItemSql = 'INSERT INTO items (name, image_url) VALUES (?, ?)';
    db.run(insertItemSql, [name.trim(), imageUrl], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ "error": "This item already exists." });
            }
            return res.status(500).json({ "error": err.message });
        }
        
        const newItemId = this.lastID;
        const tagIds = tags ? tags.split(',').map(id => parseInt(id)).filter(Boolean) : [];
        if (tagIds.length > 0) {
            const insertTagsSql = 'INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)';
            const tagStmt = db.prepare(insertTagsSql);
            tagIds.forEach(tagId => tagStmt.run(newItemId, tagId));
            tagStmt.finalize();
        }
        res.status(201).json({ "message": "Item added successfully", "id": newItemId });
    });
});

// ★★★ [POST] /api/prices : This part was also previously omitted. ★★★
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

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

