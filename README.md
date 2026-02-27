# 🎌 Yaruki - Japanese Language Learning Platform

A modern Japanese language learning platform designed specifically for **Burmese speakers**. Built with Next.js, Express, PostgreSQL, and Tailwind CSS.

မြန်မာစကားပြောသူများအတွက် ဂျပန်စာသင်ကြားရေး platform

---

## 📁 Project Structure

```
YARUKI/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── db/           # Database pool, setup, seed scripts
│   │   ├── middleware/   # Auth JWT & Multer file upload
│   │   ├── routes/       # API routes (auth, homework, quiz, dictionary)
│   │   └── server.js     # Express entry point
│   ├── uploads/          # Uploaded homework files
│   ├── .env              # Environment variables
│   └── package.json
│
├── frontend/             # Next.js 14 App Router
│   ├── src/
│   │   ├── app/          # Pages (dashboard, homework, quiz, dictionary, teacher)
│   │   ├── components/   # Shared components (Navbar, AppLayout)
│   │   └── lib/          # API client, Auth context
│   ├── .env.local        # Frontend env vars
│   └── package.json
│
└── DEPLOYMENT.md         # AWS EC2 deployment guide
```

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **Authentication** | JWT-based login/signup with role support (student/teacher/admin) |
| **Homework System** | File upload (PDF/images) via Multer, teacher review dashboard |
| **Quiz System** | N5/N4/N3 levels, Kanji & Grammar, instant feedback + scoring |
| **Dictionary** | Japanese-Burmese dictionary search (Kanji, Hiragana, English) |
| **Mobile Responsive** | Tailwind CSS, works great on phones |

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Setup PostgreSQL Database

```sql
-- Connect to PostgreSQL and create the database
CREATE DATABASE yaruki;
```

### 2. Backend Setup

```bash
cd backend
npm install

# Edit .env with your database credentials
# Then run:
npm run db:setup    # Creates tables
npm run db:seed     # Seeds test data

npm run dev         # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev         # Starts on http://localhost:3000
```

### 4. Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher@yaruki.com | admin123 |
| Admin | admin@yaruki.com | admin123 |
| Student | student@yaruki.com | student123 |

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (auth required)

### Homework
- `GET /api/homework/assignments` - List assignments
- `POST /api/homework/assignments` - Create assignment (teacher)
- `POST /api/homework/submit/:id` - Upload homework file
- `GET /api/homework/my-submissions` - Student's submissions
- `GET /api/homework/all-submissions` - All submissions (teacher)
- `GET /api/homework/download/:id` - Download file

### Quiz
- `GET /api/quiz/questions/:level` - Get questions (N5/N4/N3)
- `POST /api/quiz/submit` - Submit answers, get score
- `GET /api/quiz/history` - Quiz history

### Dictionary
- `GET /api/dictionary/search?q=word` - Search words
- `GET /api/dictionary/all` - All dictionary entries

---

## 📝 License

Built with ❤️ for Myanmar learners. © 2026 Yaruki Japanese Language School.
