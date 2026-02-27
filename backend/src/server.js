require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const homeworkRoutes = require('./routes/homework');
const quizRoutes = require('./routes/quiz');
const dictionaryRoutes = require('./routes/dictionary');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (protected in routes)
app.use('/uploads', express.static(path.join(__dirname, '..', uploadDir)));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/dictionary', dictionaryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Yaruki API is running 🎌' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🎌 Yaruki Backend running on port ${PORT}`);
});

module.exports = app;
