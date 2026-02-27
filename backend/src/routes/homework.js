const express = require('express');
const path = require('path');
const pool = require('../db/pool');
const { authMiddleware, teacherOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/homework/assignments - Get all assignments
router.get('/assignments', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.name as teacher_name,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = $1) as submitted
      FROM assignments a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.due_date DESC
    `, [req.user.id]);

    res.json({ assignments: result.rows });
  } catch (err) {
    console.error('Get assignments error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/homework/assignments - Create assignment (teacher only)
router.post('/assignments', authMiddleware, teacherOnly, async (req, res) => {
  try {
    const { title, description, due_date, level } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const result = await pool.query(
      'INSERT INTO assignments (title, description, due_date, level, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, due_date, level, req.user.id]
    );

    res.status(201).json({ assignment: result.rows[0] });
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/homework/submit/:assignmentId - Submit homework images (up to 20)
router.post('/submit/:assignmentId', authMiddleware, upload.array('files', 20), async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded.' });
    }

    // Check assignment exists
    const assignment = await pool.query('SELECT id FROM assignments WHERE id = $1', [assignmentId]);
    if (assignment.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Store file info as JSON arrays
    const filePaths = JSON.stringify(req.files.map(f => f.path));
    const fileNames = JSON.stringify(req.files.map(f => f.originalname));
    const fileTypes = JSON.stringify(req.files.map(f => f.mimetype));
    const totalSize = req.files.reduce((sum, f) => sum + f.size, 0);

    const result = await pool.query(
      `INSERT INTO submissions (assignment_id, student_id, file_path, file_name, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        assignmentId,
        req.user.id,
        filePaths,
        fileNames,
        fileTypes,
        totalSize
      ]
    );

    // Get assignment title and student name for notification
    const assignmentInfo = await pool.query(
      'SELECT title FROM assignments WHERE id = $1', [assignmentId]
    );
    const assignmentTitle = assignmentInfo.rows[0]?.title || 'Unknown Assignment';

    const studentInfo = await pool.query(
      'SELECT name FROM users WHERE id = $1', [req.user.id]
    );
    const studentName = studentInfo.rows[0]?.name || 'A student';

    // Notify all teachers and admins
    const recipients = await pool.query(
      `SELECT id FROM users WHERE role IN ('teacher', 'admin')`
    );

    const subject = `📬 New Homework Submitted: ${assignmentTitle}`;
    const body = `${studentName} has submitted homework for "${assignmentTitle}".\n\n📷 ${req.files.length} image${req.files.length !== 1 ? 's' : ''} uploaded.\n\nLog in to review and give feedback.`;

    for (const recipient of recipients.rows) {
      await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, subject, body) VALUES ($1, $2, $3, $4)`,
        [req.user.id, recipient.id, subject, body]
      );
    }

    res.status(201).json({
      message: 'Homework submitted successfully!',
      submission: result.rows[0],
      fileCount: req.files.length
    });
  } catch (err) {
    console.error('Submit homework error:', err);
    res.status(500).json({ error: 'Server error during file upload.' });
  }
});

// GET /api/homework/my-submissions - Get student's own submissions
router.get('/my-submissions', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, a.title as assignment_title
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.student_id = $1
      ORDER BY s.submitted_at DESC
    `, [req.user.id]);

    res.json({ submissions: result.rows });
  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/homework/all-submissions - Teacher view all submissions
router.get('/all-submissions', authMiddleware, teacherOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, a.title as assignment_title, u.name as student_name, u.email as student_email
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN users u ON s.student_id = u.id
      ORDER BY s.submitted_at DESC
    `);

    res.json({ submissions: result.rows });
  } catch (err) {
    console.error('Get all submissions error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/homework/feedback/:submissionId - Add feedback & notify student
router.put('/feedback/:submissionId', authMiddleware, teacherOnly, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { feedback, grade, status } = req.body;

    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ error: 'Feedback text is required.' });
    }

    const validStatus = ['reviewed', 'graded'].includes(status) ? status : 'reviewed';

    // Get submission with student + assignment info
    const subResult = await pool.query(`
      SELECT s.*, a.title as assignment_title, u.name as student_name, u.id as sid
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN users u ON s.student_id = u.id
      WHERE s.id = $1
    `, [submissionId]);

    if (subResult.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const sub = subResult.rows[0];

    // Update submission with feedback
    await pool.query(
      `UPDATE submissions SET feedback = $1, grade = $2, status = $3 WHERE id = $4`,
      [feedback.trim(), grade || null, validStatus, submissionId]
    );

    // Send notification message to student
    const subject = `📝 Homework Feedback: ${sub.assignment_title}`;
    let body = feedback.trim();
    if (grade) {
      body = `Grade: ${grade}\n\n${body}`;
    }

    await pool.query(`
      INSERT INTO messages (sender_id, receiver_id, subject, body)
      VALUES ($1, $2, $3, $4)
    `, [req.user.id, sub.sid, subject, body]);

    res.json({
      message: 'Feedback sent successfully!',
      submission: { ...sub, feedback: feedback.trim(), grade: grade || null, status: validStatus }
    });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Server error sending feedback.' });
  }
});

// GET /api/homework/download/:submissionId - Download a submission file
// ?file=0 for first image, ?file=1 for second, etc.
router.get('/download/:submissionId', authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const fileIndex = parseInt(req.query.file) || 0;

    // Teachers can download any, students only their own
    let query = 'SELECT * FROM submissions WHERE id = $1';
    const params = [submissionId];

    if (req.user.role === 'student') {
      query += ' AND student_id = $2';
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const submission = result.rows[0];

    // Handle both JSON array (multi-image) and plain string (legacy single file)
    let filePath, fileName;
    try {
      const paths = JSON.parse(submission.file_path);
      const names = JSON.parse(submission.file_name);
      if (fileIndex < 0 || fileIndex >= paths.length) {
        return res.status(404).json({ error: 'File index out of range.' });
      }
      filePath = paths[fileIndex];
      fileName = names[fileIndex];
    } catch (e) {
      // Legacy single file format
      filePath = submission.file_path;
      fileName = submission.file_name;
    }

    res.download(filePath, fileName);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Server error during download.' });
  }
});

// GET /api/homework/image/:submissionId/:fileIndex - Serve image for preview
router.get('/image/:submissionId/:fileIndex', authMiddleware, async (req, res) => {
  try {
    const { submissionId, fileIndex } = req.params;
    const idx = parseInt(fileIndex) || 0;

    let query = 'SELECT * FROM submissions WHERE id = $1';
    const params = [submissionId];

    if (req.user.role === 'student') {
      query += ' AND student_id = $2';
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const submission = result.rows[0];
    let filePath, mimeType;
    try {
      const paths = JSON.parse(submission.file_path);
      const types = JSON.parse(submission.file_type);
      if (idx < 0 || idx >= paths.length) {
        return res.status(404).json({ error: 'File index out of range.' });
      }
      filePath = paths[idx];
      mimeType = types[idx];
    } catch (e) {
      filePath = submission.file_path;
      mimeType = submission.file_type;
    }

    res.setHeader('Content-Type', mimeType);
    res.sendFile(path.resolve(filePath));
  } catch (err) {
    console.error('Image serve error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
