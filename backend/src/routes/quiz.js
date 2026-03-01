const express = require('express');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/quiz/questions/:level - Get quiz questions for a level
router.get('/questions/:level', authMiddleware, async (req, res) => {
  try {
    const { level } = req.params;
    const { category } = req.query; // optional filter: 'kanji' or 'grammar'

    if (!['N5', 'N4', 'N3', 'N2', 'N1'].includes(level.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid level. Choose N5, N4, N3, N2, or N1.' });
    }

    let query = 'SELECT id, level, category, question, option_a, option_b, option_c, option_d FROM quiz_questions WHERE level = $1';
    const params = [level.toUpperCase()];

    if (category && ['kanji', 'grammar'].includes(category)) {
      query += ' AND category = $2';
      params.push(category);
    }

    query += ' ORDER BY RANDOM() LIMIT 20';

    const result = await pool.query(query, params);
    res.json({ questions: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Get questions error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/quiz/submit - Submit quiz answers and get score
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { level, category, answers, partNumber } = req.body;
    // answers = [{ questionId: 1, answer: 'A' }, ...]

    if (!level || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Level and answers array are required.' });
    }

    // Fetch student name
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
    const studentName = userResult.rows[0]?.name || 'Unknown';

    const questionIds = answers.map(a => a.questionId);
    const result = await pool.query(
      'SELECT id, correct_answer, explanation FROM quiz_questions WHERE id = ANY($1)',
      [questionIds]
    );

    const correctMap = {};
    result.rows.forEach(q => {
      correctMap[q.id] = { correct: q.correct_answer, explanation: q.explanation };
    });

    let score = 0;
    const details = answers.map(a => {
      const correct = correctMap[a.questionId];
      const isCorrect = correct && a.answer && correct && a.answer.toUpperCase() === correct.correct;
      if (isCorrect) score++;
      return {
        questionId: a.questionId,
        yourAnswer: a.answer || '(no answer)',
        correctAnswer: correct ? correct.correct : null,
        isCorrect,
        explanation: correct ? correct.explanation : null
      };
    });

    // Save result with part number
    await pool.query(
      'INSERT INTO quiz_results (user_id, level, category, score, total) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, level, category || 'mixed', score, answers.length]
    );

    res.json({
      studentName,
      partNumber: partNumber || 1,
      score,
      total: answers.length,
      percentage: Math.round((score / answers.length) * 100),
      details
    });
  } catch (err) {
    console.error('Submit quiz error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/quiz/history - Get user's quiz history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM quiz_results WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json({ history: result.rows });
  } catch (err) {
    console.error('Get quiz history error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
