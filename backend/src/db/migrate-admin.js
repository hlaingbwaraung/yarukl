require('dotenv').config();
const pool = require('./pool');

const migrateSQL = `
-- Add status and last_login to users
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
    ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login') THEN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
    ALTER TABLE users ADD COLUMN phone VARCHAR(30);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='notes') THEN
    ALTER TABLE users ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Messages table (DM inbox)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table (mass messaging)
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'teachers')),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium', 'enterprise')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  amount DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'MMK',
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'MMK',
  payment_method VARCHAR(50) DEFAULT 'manual',
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  reference VARCHAR(255),
  notes TEXT,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add parent_id for message threading (replies)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='parent_id') THEN
    ALTER TABLE messages ADD COLUMN parent_id INTEGER REFERENCES messages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
`;

async function migrate() {
  try {
    console.log('🔧 Running admin migration...');
    await pool.query(migrateSQL);
    console.log('✅ Admin migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
