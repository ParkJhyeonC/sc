import express from 'express';
import multer from 'multer';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const app = express();

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

let db: any;

async function initDb() {
  db = await open({
    filename: path.join(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS trainings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      requester TEXT NOT NULL,
      deadline TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      training_id INTEGER NOT NULL,
      teacher_name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (training_id) REFERENCES trainings (id)
    );
  `);
}

// API Routes
app.get('/api/trainings', async (req, res) => {
  try {
    const trainings = await db.all('SELECT * FROM trainings ORDER BY deadline ASC');
    res.json(trainings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trainings' });
  }
});

app.post('/api/trainings', async (req, res) => {
  const { title, requester, deadline, description } = req.body;
  try {
    const result = await db.run(
      'INSERT INTO trainings (title, requester, deadline, description) VALUES (?, ?, ?, ?)',
      [title, requester, deadline, description]
    );
    res.json({ id: result.lastID, title, requester, deadline, description });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create training' });
  }
});

app.delete('/api/trainings/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM submissions WHERE training_id = ?', [req.params.id]);
    await db.run('DELETE FROM trainings WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete training' });
  }
});

app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await db.all(`
      SELECT s.*, t.title as training_title 
      FROM submissions s
      JOIN trainings t ON s.training_id = t.id
      ORDER BY s.submitted_at DESC
    `);
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

app.post('/api/submissions', upload.single('certificate'), async (req, res) => {
  const { training_id, teacher_name } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const result = await db.run(
      'INSERT INTO submissions (training_id, teacher_name, file_name, original_name) VALUES (?, ?, ?, ?)',
      [training_id, teacher_name, file.filename, file.originalname]
    );
    res.json({ id: result.lastID, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

app.get('/api/download/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.delete('/api/submissions/:id', async (req, res) => {
  try {
    const submission = await db.get('SELECT file_name FROM submissions WHERE id = ?', [req.params.id]);
    if (submission) {
      const filePath = path.join(uploadsDir, submission.file_name);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await db.run('DELETE FROM submissions WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

// Start Server
async function startServer() {
  await initDb();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
