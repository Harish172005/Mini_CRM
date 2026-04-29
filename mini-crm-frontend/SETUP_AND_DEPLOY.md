# Mini CRM — Setup & Deployment Guide

---

## 1. PROJECT STRUCTURE

```
mini-crm/
├── mini-crm-backend/
└── mini-crm-frontend/
```

---

## 2. LOCAL SETUP

### 2.1 Prerequisites

| Tool    | Version   |
|---------|-----------|
| Node.js | v18+      |
| npm     | v9+       |
| MongoDB | Atlas (free tier) or local |

---

### 2.2 MongoDB Atlas Setup (free)

1. Go to https://cloud.mongodb.com → Create free account
2. Create a free **M0** cluster
3. Under **Database Access** → Add user with password (e.g. crmuser / yourpassword)
4. Under **Network Access** → Add IP → Allow from anywhere (0.0.0.0/0 for dev)
5. Under **Databases** → Connect → Compass → Copy connection string
6. Replace `<password>` with your password, add `/mini-crm` before the `?`

Example:
```
mongodb+srv://crmuser:yourpassword@cluster0.abcd.mongodb.net/mini-crm?retryWrites=true&w=majority
```

---

### 2.3 Backend Setup

```bash
# 1. Navigate into backend folder
cd mini-crm-backend

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
```

Edit `.env`:
```env
MONGO_URI=mongodb+srv://crmuser:yourpassword@cluster0.abcd.mongodb.net/mini-crm?retryWrites=true&w=majority
JWT_SECRET=pick_a_long_random_string_here_min_32_chars
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

```bash
# 4. Start the backend
npm run dev
# → Server listening on port 5000
# → MongoDB connected: cluster0.abcd.mongodb.net
```

---

### 2.4 Seed a User (required before login)

The app has no registration UI — seed via Postman or curl:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Harish Kumar","email":"harish@crm.com","password":"pass1234","role":"admin"}'
```

Save the returned `token` — you'll need it to test protected endpoints.

---

### 2.5 Frontend Setup

```bash
# 1. Navigate into frontend folder
cd mini-crm-frontend

# 2. Install dependencies
npm install

# 3. Create your .env
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

```bash
# 4. Start the dev server
npm run dev
# → http://localhost:5173
```

---

### 2.6 Sample API Test Data

Once logged in, use the token as `Authorization: Bearer <token>` header.

```bash
# --- CREATE COMPANY ---
POST /api/companies
{
  "name": "Zealous Tech Corp",
  "industry": "Technology",
  "website": "zealoustech.com",
  "phone": "9876543210",
  "address": { "city": "Chennai", "country": "India" }
}

# --- CREATE LEADS ---
POST /api/leads
{
  "firstName": "Ravi", "lastName": "Sharma",
  "email": "ravi@example.com",
  "status": "New", "source": "LinkedIn"
}

POST /api/leads
{
  "firstName": "Priya", "lastName": "Patel",
  "email": "priya@example.com",
  "status": "Qualified", "source": "Referral"
}

# --- CREATE TASK ---
POST /api/tasks
{
  "title": "Follow up call with Ravi",
  "dueDate": "2025-06-15",
  "priority": "High",
  "lead": "<lead_id_from_above>"
}

# --- DASHBOARD ---
GET /api/dashboard/stats

# --- LEADS with pagination + filter ---
GET /api/leads?page=1&limit=10&status=New
GET /api/leads?search=ravi

# --- SOFT DELETE a lead ---
DELETE /api/leads/<lead_id>

# --- UPDATE TASK STATUS (only assignee) ---
PATCH /api/tasks/<task_id>/status
{ "status": "Completed" }
```

---

## 3. DEPLOYMENT GUIDE

### 3.1 Deploy Backend → Render (free)

1. Push `mini-crm-backend` to a GitHub repository

2. Go to https://render.com → Sign up free → **New Web Service**

3. Connect your GitHub repo

4. Configure:
   | Field | Value |
   |-------|-------|
   | Name | mini-crm-backend |
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `node server.js` |
   | Instance Type | Free |

5. Under **Environment Variables**, add all keys from `.env.example`:
   ```
   MONGO_URI      = <your Atlas URI>
   JWT_SECRET     = <your secret>
   JWT_EXPIRES_IN = 7d
   NODE_ENV       = production
   CLIENT_URL     = https://your-netlify-app.netlify.app
   ```

6. Click **Deploy** → Wait ~2 min → Copy the URL:
   ```
   https://mini-crm-backend.onrender.com
   ```

> ⚠️  Render free tier spins down after 15 min of inactivity.
> First request after sleep takes ~30 sec. Upgrade to Starter ($7/mo) to avoid this.

---

### 3.2 Deploy Frontend → Netlify (free)

1. Push `mini-crm-frontend` to a GitHub repository

2. Go to https://netlify.com → Sign up free → **Add new site → Import from Git**

3. Connect your GitHub repo

4. Configure:
   | Field | Value |
   |-------|-------|
   | Build Command | `npm run build` |
   | Publish Directory | `dist` |

5. Under **Site Configuration → Environment Variables**, add:
   ```
   VITE_API_BASE_URL = https://mini-crm-backend.onrender.com/api
   ```

6. Add a `_redirects` file inside `mini-crm-frontend/public/`:
   ```
   /*  /index.html  200
   ```
   This ensures React Router works on direct URL access (e.g. `/leads`).

7. Click **Deploy** → Your app is live at:
   ```
   https://your-app-name.netlify.app
   ```

---

### 3.3 Post-Deployment Checklist

- [ ] Backend health check: `GET https://mini-crm-backend.onrender.com/`
       → Should return `{ "status": "Mini CRM API running 🚀" }`
- [ ] Register first user via Postman against the Render URL
- [ ] Login via the Netlify frontend
- [ ] Verify CORS: `CLIENT_URL` on Render matches your Netlify URL exactly
- [ ] Test all 5 pages: Dashboard, Leads, Companies, Company Detail, Tasks

---

## 4. ENVIRONMENT VARIABLES REFERENCE

### Backend `.env`
| Key | Description | Example |
|-----|-------------|---------|
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Random string ≥32 chars | `abc123...xyz` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `production` |
| `CLIENT_URL` | Frontend origin for CORS | `https://yourapp.netlify.app` |

### Frontend `.env`
| Key | Description | Example |
|-----|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `https://mini-crm-backend.onrender.com/api` |

---

## 5. COMPLETE API REFERENCE

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register user |
| POST | `/api/auth/login` | ❌ | Login → returns JWT |
| GET  | `/api/auth/me` | ✅ | Get current user |

### Leads
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/api/leads` | ✅ | List leads (page, limit, search, status) |
| POST   | `/api/leads` | ✅ | Create lead |
| GET    | `/api/leads/:id` | ✅ | Get single lead |
| PUT    | `/api/leads/:id` | ✅ | Update lead |
| PATCH  | `/api/leads/:id/status` | ✅ | Update status only |
| DELETE | `/api/leads/:id` | ✅ | Soft delete |

### Companies
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/api/companies` | ✅ | List companies (page, limit, search, industry) |
| POST   | `/api/companies` | ✅ | Create company |
| GET    | `/api/companies/:id` | ✅ | Get company + associated leads |
| PUT    | `/api/companies/:id` | ✅ | Update company |
| DELETE | `/api/companies/:id` | ✅ | Delete + unlink leads |

### Tasks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/api/tasks` | ✅ | List tasks (status, priority, assignedTo, lead) |
| POST   | `/api/tasks` | ✅ | Create task |
| GET    | `/api/tasks/:id` | ✅ | Get single task |
| PUT    | `/api/tasks/:id` | ✅ | Update task (creator/admin) |
| PATCH  | `/api/tasks/:id/status` | ✅ | Update status (assignee/admin ONLY) |
| DELETE | `/api/tasks/:id` | ✅ | Delete task (creator/admin) |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/api/dashboard/stats` | ✅ | All KPIs + charts + recent leads |
| GET    | `/api/dashboard/tasks-due-today` | ✅ | Today's pending tasks |
| GET    | `/api/dashboard/lead-trend` | ✅ | 30-day lead creation trend |

---

## 6. FOLDER STRUCTURE (FINAL)

```
mini-crm-backend/
├── config/db.js
├── controllers/
│   ├── authController.js
│   ├── companyController.js
│   ├── dashboardController.js
│   ├── leadController.js
│   └── taskController.js
├── middleware/authMiddleware.js
├── models/
│   ├── Company.js
│   ├── Lead.js
│   ├── Task.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── companyRoutes.js
│   ├── dashboardRoutes.js
│   ├── leadRoutes.js
│   └── taskRoutes.js
├── .env.example
├── package.json
└── server.js

mini-crm-frontend/
├── public/
│   └── _redirects          ← Add this before Netlify deploy
├── src/
│   ├── api/axios.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   └── Sidebar.jsx
│   │   └── shared/
│   │       ├── LoadingSpinner.jsx
│   │       ├── PageHeader.jsx
│   │       └── PrivateRoute.jsx
│   ├── context/AuthContext.jsx
│   ├── hooks/useDebounce.js
│   ├── pages/
│   │   ├── companies/
│   │   │   ├── CompaniesList.jsx
│   │   │   └── CompanyDetail.jsx
│   │   ├── leads/
│   │   │   ├── LeadFormModal.jsx
│   │   │   └── LeadsList.jsx
│   │   ├── tasks/
│   │   │   └── TasksPage.jsx
│   │   ├── Dashboard.jsx
│   │   └── Login.jsx
│   ├── utils/helpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── theme.js
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```
