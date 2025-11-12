// server/server.js
import express from 'express';
const app = express();

// --- fundamentals middleware ---
app.use(express.json()); // parse JSON request bodies

// allow the Vite dev server (different port) to call this API
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// --- in-memory data (no DB) ---
let students = [
  { id: 1, name: 'Aisha' },
  { id: 2, name: 'Hasan' }
];

// --- routes ---
// Read: client requests data
app.get('/api/students', (req, res) => {
  res.json(students);
});

// Create: client sends data
app.post('/api/students', (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const newStudent = { id: Date.now(), name: name.trim() };
  students.push(newStudent);
  res.status(201).json(newStudent);
});

// --- start server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
});
//
//
