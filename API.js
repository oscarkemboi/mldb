const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Use express.json() middleware to parse JSON bodies
app.use(express.json());

// Path to the SQLite database in the root folder
const dbPath = path.join(__dirname, 'posts.sqlite');

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Ensure the posts table exists (create if not)
db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    post_title TEXT NOT NULL,
    post_content TEXT NOT NULL
  )
`, (err) => {
  if (err) {
    console.error('Failed to create posts table:', err.message);
  } else {
    console.log('Posts table is ready.');
  }
});

// GET all posts
app.get('/api/posts', (req, res) => {
  db.all('SELECT * FROM posts', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ posts: rows });
  });
});

// GET a single post by ID
app.get('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM posts WHERE ID = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    res.json(row);
  });
});

// PUT endpoint to update a post by ID
app.put('/api/posts/:id', (req, res) => {
  const { post_title, post_content } = req.body;
  const { id } = req.params;

  if (!post_title || !post_content) {
    return res.status(400).json({ error: 'post_title and post_content are required.' });
  }

  const sql = `
    UPDATE posts
    SET post_title = ?, post_content = ?
    WHERE ID = ?
  `;

  db.run(sql, [post_title, post_content, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    res.json({ message: 'Post updated successfully.', changes: this.changes });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
