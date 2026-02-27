const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(authMiddleware);
router.use(adminOnly);

// ============================================================
// ANALYTICS / DASHBOARD STATS
// ============================================================

// GET /api/admin/analytics - Overall dashboard statistics
router.get('/analytics', async (req, res) => {
  try {
    // Total counts
    const usersCount = await pool.query(`SELECT 
      COUNT(*) FILTER (WHERE role = 'student') as total_students,
      COUNT(*) FILTER (WHERE role = 'teacher') as total_teachers,
      COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE status = 'active') as active_users,
      COUNT(*) FILTER (WHERE status = 'suspended') as suspended_users,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d
    FROM users`);

    const quizStats = await pool.query(`SELECT 
      COUNT(*) as total_attempts,
      ROUND(AVG(score::decimal / NULLIF(total,0) * 100), 1) as avg_score_pct,
      COUNT(*) FILTER (WHERE completed_at > NOW() - INTERVAL '7 days') as attempts_7d
    FROM quiz_results`);

    const homeworkStats = await pool.query(`SELECT
      COUNT(*) as total_assignments,
      (SELECT COUNT(*) FROM submissions) as total_submissions,
      (SELECT COUNT(*) FROM submissions WHERE status = 'submitted') as pending_reviews,
      (SELECT COUNT(*) FROM submissions WHERE submitted_at > NOW() - INTERVAL '7 days') as submissions_7d
    FROM assignments`);

    const paymentStats = await pool.query(`SELECT
      COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_payments,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_payments,
      COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND paid_at > NOW() - INTERVAL '30 days'), 0) as revenue_30d
    FROM payments`);

    const subscriptionStats = await pool.query(`SELECT
      COUNT(*) FILTER (WHERE status = 'active') as active_subs,
      COUNT(*) FILTER (WHERE plan = 'free') as free_plan,
      COUNT(*) FILTER (WHERE plan = 'basic') as basic_plan,
      COUNT(*) FILTER (WHERE plan = 'premium') as premium_plan,
      COUNT(*) FILTER (WHERE plan = 'enterprise') as enterprise_plan
    FROM subscriptions`);

    const recentActivity = await pool.query(`
      SELECT al.*, u.name as user_name, u.email as user_email 
      FROM activity_log al 
      LEFT JOIN users u ON al.user_id = u.id 
      ORDER BY al.created_at DESC LIMIT 10
    `);

    // Monthly signup trends (last 6 months)
    const signupTrends = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as signups
      FROM users 
      WHERE created_at > NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month
    `);

    res.json({
      users: usersCount.rows[0],
      quiz: quizStats.rows[0],
      homework: homeworkStats.rows[0],
      payments: paymentStats.rows[0],
      subscriptions: subscriptionStats.rows[0],
      recentActivity: recentActivity.rows,
      signupTrends: signupTrends.rows,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ============================================================
// STUDENT MANAGEMENT
// ============================================================

// GET /api/admin/students - List all users with filtering
router.get('/students', async (req, res) => {
  try {
    const { search, role, status, sort, order, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const offset = (pageNum - 1) * pageSize;

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereConditions.push(`(u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }
    if (role) {
      paramCount++;
      whereConditions.push(`u.role = $${paramCount}`);
      params.push(role);
    }
    if (status) {
      paramCount++;
      whereConditions.push(`u.status = $${paramCount}`);
      params.push(status);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const sortColumn = ['name', 'email', 'role', 'status', 'created_at', 'last_login'].includes(sort)
      ? `u.${sort}` : 'u.created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users u ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    // Fetch users with stats
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.status, u.phone, u.notes,
             u.created_at, u.updated_at, u.last_login,
             (SELECT COUNT(*) FROM quiz_results qr WHERE qr.user_id = u.id) as quiz_count,
             (SELECT COUNT(*) FROM submissions s WHERE s.student_id = u.id) as submission_count,
             (SELECT plan FROM subscriptions sub WHERE sub.user_id = u.id AND sub.status = 'active' ORDER BY sub.created_at DESC LIMIT 1) as current_plan
      FROM users u
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, pageSize, offset]);

    res.json({
      students: result.rows,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      }
    });
  } catch (err) {
    console.error('List students error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/admin/students/:id - Get single student detail
router.get('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await pool.query(`
      SELECT id, name, email, role, status, phone, notes, created_at, updated_at, last_login
      FROM users WHERE id = $1
    `, [id]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get quiz history
    const quizHistory = await pool.query(`
      SELECT * FROM quiz_results WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 20
    `, [id]);

    // Get submissions
    const submissions = await pool.query(`
      SELECT s.*, a.title as assignment_title 
      FROM submissions s 
      LEFT JOIN assignments a ON s.assignment_id = a.id 
      WHERE s.student_id = $1 
      ORDER BY s.submitted_at DESC LIMIT 20
    `, [id]);

    // Get subscription
    const subscription = await pool.query(`
      SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
    `, [id]);

    // Get payments
    const payments = await pool.query(`
      SELECT * FROM payments WHERE user_id = $1 ORDER BY paid_at DESC LIMIT 10
    `, [id]);

    // Get recent activity
    const activity = await pool.query(`
      SELECT * FROM activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20
    `, [id]);

    res.json({
      user: user.rows[0],
      quizHistory: quizHistory.rows,
      submissions: submissions.rows,
      subscription: subscription.rows[0] || null,
      payments: payments.rows,
      activity: activity.rows,
    });
  } catch (err) {
    console.error('Get student error:', err);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
});

// PUT /api/admin/students/:id - Update student info
router.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, phone, notes } = req.body;

    const result = await pool.query(`
      UPDATE users SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        status = COALESCE($4, status),
        phone = COALESCE($5, phone),
        notes = COALESCE($6, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, name, email, role, status, phone, notes, updated_at
    `, [name, email, role, status, phone, notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log activity
    await pool.query(
      `INSERT INTO activity_log (user_id, action, details) VALUES ($1, $2, $3)`,
      [req.user.id, 'admin_update_user', `Updated user #${id}: ${JSON.stringify({ name, email, role, status })}`]
    );

    res.json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// PUT /api/admin/students/:id/status - Change user status (activate/suspend/block)
router.put('/students/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active, suspended, or blocked.' });
    }

    const result = await pool.query(
      `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query(
      `INSERT INTO activity_log (user_id, action, details) VALUES ($1, $2, $3)`,
      [req.user.id, 'admin_change_status', `Set user #${id} status to ${status}`]
    );

    res.json({ message: `User status changed to ${status}`, user: result.rows[0] });
  } catch (err) {
    console.error('Change status error:', err);
    res.status(500).json({ error: 'Failed to change status' });
  }
});

// PUT /api/admin/students/:id/reset-password - Force reset user password
router.put('/students/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const result = await pool.query(
      `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email`,
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query(
      `INSERT INTO activity_log (user_id, action, details) VALUES ($1, $2, $3)`,
      [req.user.id, 'admin_reset_password', `Reset password for user #${id}`]
    );

    res.json({ message: 'Password reset successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// DELETE /api/admin/students/:id - Delete a user account
router.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING id, name, email`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query(
      `INSERT INTO activity_log (user_id, action, details) VALUES ($1, $2, $3)`,
      [req.user.id, 'admin_delete_user', `Deleted user: ${result.rows[0].name} (${result.rows[0].email})`]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================================
// MESSAGES (DM Inbox)
// ============================================================

// GET /api/admin/messages - Get admin messages (inbox/sent)
router.get('/messages', async (req, res) => {
  try {
    const { type, search, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const offset = (pageNum - 1) * pageSize;

    let query, countQuery, params = [];
    let paramCount = 0;

    if (type === 'sent') {
      const baseWhere = `WHERE m.sender_id = $1`;
      paramCount = 1;
      params = [req.user.id];

      if (search) {
        paramCount++;
        params.push(`%${search}%`);
      }

      const searchClause = search ? ` AND (m.subject ILIKE $${paramCount} OR r.name ILIKE $${paramCount})` : '';

      countQuery = `SELECT COUNT(*) FROM messages m LEFT JOIN users r ON m.receiver_id = r.id ${baseWhere}${searchClause}`;
      query = `
        SELECT m.*, 
          s.name as sender_name, s.email as sender_email,
          r.name as receiver_name, r.email as receiver_email
        FROM messages m
        LEFT JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.receiver_id = r.id
        ${baseWhere}${searchClause}
        ORDER BY m.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(pageSize, offset);
    } else {
      // inbox
      const baseWhere = `WHERE m.receiver_id = $1`;
      paramCount = 1;
      params = [req.user.id];

      if (search) {
        paramCount++;
        params.push(`%${search}%`);
      }

      const searchClause = search ? ` AND (m.subject ILIKE $${paramCount} OR s.name ILIKE $${paramCount})` : '';

      countQuery = `SELECT COUNT(*) FROM messages m LEFT JOIN users s ON m.sender_id = s.id ${baseWhere}${searchClause}`;
      query = `
        SELECT m.*, 
          s.name as sender_name, s.email as sender_email,
          r.name as receiver_name, r.email as receiver_email
        FROM messages m
        LEFT JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.receiver_id = r.id
        ${baseWhere}${searchClause}
        ORDER BY m.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(pageSize, offset);
    }

    const countParams = params.slice(0, paramCount);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(query, params);

    // Count unread
    const unreadResult = await pool.query(
      `SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );

    res.json({
      messages: result.rows,
      unread: parseInt(unreadResult.rows[0].count),
      pagination: { page: pageNum, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/admin/messages - Send a message
router.post('/messages', async (req, res) => {
  try {
    const { receiverId, subject, body } = req.body;

    if (!receiverId || !subject || !body) {
      return res.status(400).json({ error: 'receiverId, subject, and body are required' });
    }

    // Verify receiver exists
    const receiver = await pool.query('SELECT id, name FROM users WHERE id = $1', [receiverId]);
    if (receiver.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const result = await pool.query(`
      INSERT INTO messages (sender_id, receiver_id, subject, body)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.user.id, receiverId, subject, body]);

    res.status(201).json({ message: 'Message sent', data: result.rows[0] });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// PUT /api/admin/messages/:id/read - Mark message as read
router.put('/messages/:id/read', async (req, res) => {
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

// DELETE /api/admin/messages/:id - Delete a message
router.delete('/messages/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM messages WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// ============================================================
// ANNOUNCEMENTS
// ============================================================

// GET /api/admin/announcements - List announcements
router.get('/announcements', async (req, res) => {
  try {
    const { page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const offset = (pageNum - 1) * pageSize;

    const countResult = await pool.query('SELECT COUNT(*) FROM announcements');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(`
      SELECT a.*, u.name as author_name, u.email as author_email
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.is_pinned DESC, a.created_at DESC
      LIMIT $1 OFFSET $2
    `, [pageSize, offset]);

    res.json({
      announcements: result.rows,
      pagination: { page: pageNum, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (err) {
    console.error('Get announcements error:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// POST /api/admin/announcements - Create announcement
router.post('/announcements', async (req, res) => {
  try {
    const { title, body, targetAudience, isPinned } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const result = await pool.query(`
      INSERT INTO announcements (author_id, title, body, target_audience, is_pinned)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.user.id, title, body, targetAudience || 'all', isPinned || false]);

    await pool.query(
      `INSERT INTO activity_log (user_id, action, details) VALUES ($1, $2, $3)`,
      [req.user.id, 'create_announcement', `Created: ${title}`]
    );

    res.status(201).json({ message: 'Announcement created', announcement: result.rows[0] });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// PUT /api/admin/announcements/:id - Update announcement
router.put('/announcements/:id', async (req, res) => {
  try {
    const { title, body, targetAudience, isPinned } = req.body;

    const result = await pool.query(`
      UPDATE announcements SET
        title = COALESCE($1, title),
        body = COALESCE($2, body),
        target_audience = COALESCE($3, target_audience),
        is_pinned = COALESCE($4, is_pinned)
      WHERE id = $5
      RETURNING *
    `, [title, body, targetAudience, isPinned, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ message: 'Announcement updated', announcement: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// DELETE /api/admin/announcements/:id - Delete announcement
router.delete('/announcements/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM announcements WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// ============================================================
// PAYMENTS & SUBSCRIPTIONS
// ============================================================

// GET /api/admin/payments - List all payments
router.get('/payments', async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const offset = (pageNum - 1) * pageSize;

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereConditions.push(`p.status = $${paramCount}`);
      params.push(status);
    }
    if (search) {
      paramCount++;
      whereConditions.push(`(u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR p.reference ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM payments p LEFT JOIN users u ON p.user_id = u.id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(`
      SELECT p.*, u.name as user_name, u.email as user_email
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY p.paid_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, pageSize, offset]);

    // Summary stats
    const summary = await pool.query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount
      FROM payments
    `);

    res.json({
      payments: result.rows,
      summary: summary.rows[0],
      pagination: { page: pageNum, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST /api/admin/payments - Record a payment
router.post('/payments', async (req, res) => {
  try {
    const { userId, amount, currency, paymentMethod, status, reference, notes } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: 'userId and amount are required' });
    }

    const result = await pool.query(`
      INSERT INTO payments (user_id, amount, currency, payment_method, status, reference, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, amount, currency || 'MMK', paymentMethod || 'manual', status || 'completed', reference, notes]);

    await pool.query(
      `INSERT INTO activity_log (user_id, action, details) VALUES ($1, $2, $3)`,
      [req.user.id, 'record_payment', `Payment of ${amount} ${currency || 'MMK'} for user #${userId}`]
    );

    res.status(201).json({ message: 'Payment recorded', payment: result.rows[0] });
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// PUT /api/admin/payments/:id - Update payment status
router.put('/payments/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;

    const result = await pool.query(`
      UPDATE payments SET
        status = COALESCE($1, status),
        notes = COALESCE($2, notes)
      WHERE id = $3
      RETURNING *
    `, [status, notes, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Payment updated', payment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// GET /api/admin/subscriptions - List all subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.name as user_name, u.email as user_email
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);
    res.json({ subscriptions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// POST /api/admin/subscriptions - Create/update subscription for a user
router.post('/subscriptions', async (req, res) => {
  try {
    const { userId, plan, amount, currency, startDate, endDate } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({ error: 'userId and plan are required' });
    }

    // Deactivate any existing active subscription
    await pool.query(
      `UPDATE subscriptions SET status = 'expired' WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    const result = await pool.query(`
      INSERT INTO subscriptions (user_id, plan, amount, currency, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, plan, amount || 0, currency || 'MMK', startDate || new Date(), endDate]);

    res.status(201).json({ message: 'Subscription created', subscription: result.rows[0] });
  } catch (err) {
    console.error('Create subscription error:', err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// PUT /api/admin/subscriptions/:id - Update subscription
router.put('/subscriptions/:id', async (req, res) => {
  try {
    const { plan, status, endDate } = req.body;

    const result = await pool.query(`
      UPDATE subscriptions SET
        plan = COALESCE($1, plan),
        status = COALESCE($2, status),
        end_date = COALESCE($3, end_date)
      WHERE id = $4
      RETURNING *
    `, [plan, status, endDate, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ message: 'Subscription updated', subscription: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// ============================================================
// ACTIVITY LOG
// ============================================================

// GET /api/admin/activity - Get activity log
router.get('/activity', async (req, res) => {
  try {
    const { userId, action, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 50;
    const offset = (pageNum - 1) * pageSize;

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      whereConditions.push(`al.user_id = $${paramCount}`);
      params.push(userId);
    }
    if (action) {
      paramCount++;
      whereConditions.push(`al.action ILIKE $${paramCount}`);
      params.push(`%${action}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const result = await pool.query(`
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, pageSize, offset]);

    res.json({ activity: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

module.exports = router;
