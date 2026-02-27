const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/dictionary/search?q=word - Search dictionary (public)
router.get('/search', async (req, res) => {
  try {
    const { q, level } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const searchTerm = `%${q.trim()}%`;
    let query = `
      SELECT * FROM dictionary 
      WHERE japanese ILIKE $1 
        OR reading ILIKE $1 
        OR english ILIKE $1 
        OR burmese ILIKE $1
    `;
    const params = [searchTerm];

    if (level && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(level.toUpperCase())) {
      query += ' AND level = $2';
      params.push(level.toUpperCase());
    }

    query += ' ORDER BY level ASC, japanese ASC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ results: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Dictionary search error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/dictionary/all - Get all dictionary entries
router.get('/all', async (req, res) => {
  try {
    const { level } = req.query;
    let query = 'SELECT * FROM dictionary';
    const params = [];

    if (level && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(level.toUpperCase())) {
      query += ' WHERE level = $1';
      params.push(level.toUpperCase());
    }

    query += ' ORDER BY level ASC, japanese ASC';

    const result = await pool.query(query, params);
    res.json({ results: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Dictionary all error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
