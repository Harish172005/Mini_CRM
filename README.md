# Mini CRM — Full Stack Application

A production-ready CRM built with **React + MUI** (frontend) and **Node.js + Express + MongoDB** (backend).

---

## 🚀 Quick Start (3 Steps)

### Step 1 — Configure Backend
```bash
cd mini-crm-backend
cp .env.example .env
```
Edit `.env` and set your `MONGO_URI` (MongoDB Atlas connection string).

### Step 2 — Install & Run Backend
```bash
cd mini-crm-backend
npm install
npm run dev
# → Running on http://localhost:5000
```

### Step 3 — Install & Run Frontend
```bash
cd mini-crm-frontend
npm install
npm run dev
# → Running on http://localhost:5173
```

### Step 4 — Create First User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Your Name","email":"you@example.com","password":"pass1234","role":"admin"}'
```
Then open http://localhost:5173 and login!

---

## 📁 Structure
```
mini-crm/
├── mini-crm-backend/     # Node + Express + MongoDB API
└── mini-crm-frontend/    # React + Vite + MUI App
```

## 🛠 Tech Stack
- **Frontend**: React 18, React Router 6, MUI v5, Axios, Vite
- **Backend**: Node.js, Express, Mongoose, JWT, bcryptjs
- **Database**: MongoDB (Atlas)

## 📖 Full Documentation
See `mini-crm-frontend/SETUP_AND_DEPLOY.md` for:
- Detailed setup guide
- Deployment to Render + Netlify
- Full API reference
- Sample test data
