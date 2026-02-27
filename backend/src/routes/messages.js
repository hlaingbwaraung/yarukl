const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

// All message routes require authentication
router.use(authMiddleware);

// ============================================================
// USER MESSAGES (Inbox / Sent / Notifications)
// ============================================================

// GET /api/messages - Get user's inbox messages
router.get('/', async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const offset = (pageNum - 1) * pageSize;

    let params = [req.user.id];
    let paramCount = 1;
    let searchClause = '';

    if (search) {
      paramCount++;
      params.push(`%${search}%`);
      searchClause = ` AND (m.subject ILIKE $${paramCount} OR m.body ILIKE $${paramCount} OR s.name ILIKE $${paramCount})`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM messages m LEFT JOIN users s ON m.sender_id = s.id WHERE m.receiver_id = $1${searchClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(`
      SELECT m.*, 
        s.name as sender_name, s.email as sender_email, s.role as sender_role,
        r.name as receiver_name, r.email as receiver_email
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      WHERE m.receiver_id = $1${searchClause}
      ORDER BY m.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, pageSize, offset]);

    res.json({
      messages: result.rows,
      pagination: { page: pageNum, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (err) {
    console.error('Get user messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/messages/sent - Get user's sent messages
router.get('/sent', async (req, res) => {
  try {
    const { page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const offset = (pageNum - 1) * pageSize;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM messages WHERE sender_id = $1`, [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(`
      SELECT m.*, 
        s.name as sender_name, s.email as sender_email,
        r.name as receiver_name, r.email as receiver_email, r.role as receiver_role
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      WHERE m.sender_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, pageSize, offset]);

    res.json({
      messages: result.rows,
      pagination: { page: pageNum, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (err) {
    console.error('Get sent messages error:', err);
    res.status(500).json({ error: 'Failed to fetch sent messages' });
  }
});

// GET /api/messages/unread-count - Get unread message count (for notification badge)
router.get('/unread-count', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    res.json({ unread: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// GET /api/messages/notifications - Get recent unread messages as notifications
router.get('/notifications', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.id, m.subject, m.body, m.is_read, m.created_at,
        s.name as sender_name, s.role as sender_role
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      WHERE m.receiver_id = $1
      ORDER BY m.created_at DESC
      LIMIT 10
    `, [req.user.id]);

    const unreadResult = await pool.query(
      `SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );

    res.json({
      notifications: result.rows,
      unread: parseInt(unreadResult.rows[0].count)
    });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/messages/:id - Get single message detail
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, 
        s.name as sender_name, s.email as sender_email, s.role as sender_role,
        r.name as receiver_name, r.email as receiver_email, r.role as receiver_role
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      WHERE m.id = $1 AND (m.receiver_id = $2 OR m.sender_id = $2)
    `, [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Auto-mark as read if receiver
    if (result.rows[0].receiver_id === req.user.id && !result.rows[0].is_read) {
      await pool.query(`UPDATE messages SET is_read = TRUE WHERE id = $1`, [req.params.id]);
      result.rows[0].is_read = true;
    }

    // Get conversation thread (the original + all replies in the chain)
    const thread = await pool.query(`
      SELECT m.*, 
        s.name as sender_name, s.email as sender_email, s.role as sender_role
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      WHERE m.parent_id = $1 OR m.id = $1
      ORDER BY m.created_at ASC
    `, [result.rows[0].parent_id || req.params.id]);

    res.json({
      message: result.rows[0],
      thread: thread.rows
    });
  } catch (err) {
    console.error('Get message detail error:', err);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// POST /api/messages/reply/:id - Reply to a message
router.post('/reply/:id', async (req, res) => {
  try {
    const { body } = req.body;
    const messageId = req.params.id;

    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Reply body is required' });
    }

    // Get original message to find the other participant
    const original = await pool.query(
      `SELECT * FROM messages WHERE id = $1 AND (receiver_id = $2 OR sender_id = $2)`,
      [messageId, req.user.id]
    );

    if (original.rows.length === 0) {
      return res.status(404).json({ error: 'Original message not found' });
    }

    const origMsg = original.rows[0];
    // Reply goes to the other participant
    const receiverId = origMsg.sender_id === req.user.id ? origMsg.receiver_id : origMsg.sender_id;
    const parentId = origMsg.parent_id || origMsg.id; // Thread tracking

    const result = await pool.query(`
      INSERT INTO messages (sender_id, receiver_id, subject, body, parent_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.user.id, receiverId, `Re: ${origMsg.subject.replace(/^Re: /i, '')}`, body, parentId]);

    // Get sender info for response
    const sender = await pool.query('SELECT name, email, role FROM users WHERE id = $1', [req.user.id]);

    res.status(201).json({
      message: 'Reply sent',
      data: {
        ...result.rows[0],
        sender_name: sender.rows[0]?.name,
        sender_email: sender.rows[0]?.email,
        sender_role: sender.rows[0]?.role,
      }
    });
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// PUT /api/messages/:id/read - Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    await pool.query(
      `UPDATE messages SET is_read = TRUE WHERE id = $1 AND receiver_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// PUT /api/messages/read-all - Mark all messages as read
router.put('/read-all', async (req, res) => {
  try {
    await pool.query(
      `UPDATE messages SET is_read = TRUE WHERE receiver_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    res.json({ message: 'All messages marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// DELETE /api/messages/:id - Delete own message
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM messages WHERE id = $1 AND (receiver_id = $2 OR sender_id = $2) RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
