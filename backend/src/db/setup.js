require('dotenv').config();
const pool = require('./pool');

const setupSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked')),
  phone VARCHAR(50),
  notes TEXT,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignments table (created by teachers)
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  level VARCHAR(10) CHECK (level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Homework submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'graded')),
  grade VARCHAR(10),
  feedback TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  level VARCHAR(10) NOT NULL CHECK (level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('kanji', 'grammar')),
  question TEXT NOT NULL,
  option_a VARCHAR(255) NOT NULL,
  option_b VARCHAR(255) NOT NULL,
  option_c VARCHAR(255) NOT NULL,
  option_d VARCHAR(255) NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT
);

-- Quiz results table
CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  level VARCHAR(10) NOT NULL,
  category VARCHAR(20) NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dictionary table
CREATE TABLE IF NOT EXISTS dictionary (
  id SERIAL PRIMARY KEY,
  japanese VARCHAR(100) NOT NULL,
  reading VARCHAR(100),
  english VARCHAR(255) NOT NULL,
  burmese VARCHAR(255) NOT NULL,
  level VARCHAR(10) CHECK (level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  category VARCHAR(50),
  example_sentence TEXT,
  example_reading TEXT,
  example_burmese TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_level_category ON quiz_questions(level, category);
CREATE INDEX IF NOT EXISTS idx_dictionary_japanese ON dictionary(japanese);
CREATE INDEX IF NOT EXISTS idx_dictionary_english ON dictionary(english);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);

-- Messages table (for notifications and communication)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_seen BOOLEAN DEFAULT FALSE,
  seen_at TIMESTAMP,
  parent_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_id);
`;

async function setup() {
  try {
    console.log('🔧 Setting up database tables...');
    await pool.query(setupSQL);
    console.log('✅ Database tables created successfully!');
  } catch (err) {
    console.error('❌ Error setting up database:', err.message);
  } finally {
    await pool.end();
  }
}

setup();
