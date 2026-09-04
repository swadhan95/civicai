# CivicAI – AI-Powered Public Issue Reporting

[![Status](https://img.shields.io/badge/status-active-emerald.svg)]()
[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite%20%2B%20Tailwind-blue.svg)]()
[![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-green.svg)]()
[![Database](https://img.shields.io/badge/database-MongoDB-brightgreen.svg)]()

> *"See it. Report it. Improve your community."*

CivicAI is a production-grade, modular full-stack civic technology web application built for hackathons and production evolution. It bridges the gap between citizens and municipal authorities through AI photo classification, automatic priority scoring, smart geolocation mapping, dynamic department routing, duplicate issue clustering, and a merit-based Civic Contributor / Impact ranking system.

---

## Table of Contents
1. [Key Features](#key-features)
2. [Demo User Accounts](#demo-user-accounts)
3. [Architecture & Project Structure](#architecture--project-structure)
4. [Technologies Used](#technologies-used)
5. [Prerequisites & Zero-Config Database](#prerequisites--zero-config-database)
6. [Installation & Setup](#installation--setup)
7. [Running the Application](#running-the-application)
8. [API Endpoints Reference](#api-endpoints-reference)
9. [AI Service Layer & Integration](#ai-service-layer--integration)
10. [Duplicate Detection & Clustering Engine](#duplicate-detection--clustering-engine)
11. [Civic Contributor Ranking & Anti-Spam Engine](#civic-contributor-ranking--anti-spam-engine)
12. [Extending & Adding New Features](#extending--adding-new-features)
13. [Troubleshooting & Known Limitations](#troubleshooting--known-limitations)

---

## 1. Key Features

### 🌟 Citizen Experience
- **Step-by-Step Reporting Wizard**:
  - **Step 1 (Photo)**: Upload, drag-and-drop, or use camera input.
  - **Step 2 (AI Analysis)**: AI abstraction classifies defect (Pothole, Broken Streetlight, Water Leak, Garbage, Damaged Road, Blocked Drain, Fallen Tree, Traffic Signal) with confidence score; citizen can confirm or manually override.
  - **Step 3 (Smart Location)**: GPS auto-detects latitude/longitude and reverse geocodes coordinates to street addresses via OpenStreetMap with an interactive Leaflet pinpoint map.
  - **Step 4 (Routing & Priority)**: Dynamically calculated priority (LOW, MEDIUM, HIGH, CRITICAL) and suggested department based on database rules.
  - **Step 5 (Duplicate Proximity Warning & Submission)**: Detects if another citizen reported the same defect within ~75m. Generates unique complaint ID `CIV-2026-XXXXXX`.
- **Citizen Impact Dashboard**: Tracks total complaints, valid accepted reports, repairs completed, points, and rank progression bar.
- **Civic Contributor Leaderboard**: Filter by Weekly, Monthly, and All-Time with privacy-preserving display names.
- **My Complaints Timeline**: Complete audit log of municipal crew movements.

### 🏛️ Municipal Officer Portal
- **Operational Command Center**: Total issues, Pending, In Progress, Resolved, Critical hazards, and High-priority metrics.
- **Visual Analytics**: Interactive Recharts breakdown by category, priority, and department status.
- **Incident Queue & Assignment**: Filter by status, assign departments, and record internal field notes.
- **Resolution Verification (Before vs After)**: Officers upload a completed repair ("AFTER") photograph, trigger an AI resolution verification assessment, and mark resolved.
- **Automated Citizen Rewards**: Resolving a verified issue automatically awards the reporting citizen +40 Civic Points and notifies them immediately.

### 🏛️ Municipal Officer & Personnel Provisioning (Enterprise Security Model)
To prevent unauthorized citizens from tampering with civic infrastructure and complaints, **public signup is dedicated to Citizens**. Officers cannot self-register through public forms. Instead:
1. The **City Administrator** onboards and provisions new municipal officers from the **Admin Panel** (`/admin/settings` ➔ **"Personnel & Officers"** ➔ **"+ Onboard New Officer"**).
2. The Admin assigns the officer's **Full Name**, **Government Email**, **Assigned Department** (e.g., Road Maintenance, Sanitation, Water Supply, Drainage, Electrical), and **Initial Password**.
3. The officer then logs in through the **Officer Portal** (`/login` ➔ Officer tab) using their provisioned credentials.

### ⚙️ Admin Governance & Rules Engine
- **Dynamic Point Rules**: Modify points without code edits (Valid accepted +20, Officer confirmed +30, Resolved +40, Unique +20, Spam penalty -20).
- **Dynamic Rank Thresholds**: Adjust points required for Beginner, Bronze, Silver, Gold, Platinum, and Civic Champion tiers.
- **Points Audit Ledger**: Full traceability of every point transaction.
- **User & Role Management**: Promote or reassign roles across Citizen, Officer, and Admin.

---

## 2. Demo User Accounts

CivicAI comes pre-seeded with realistic demonstration accounts. On the Login page (`/login`), you can click any of the **Instant Demo Evaluator Login** buttons to authenticate immediately without typing:

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen (Silver)** | Rahul Sharma | `citizen@civicai.org` | `Citizen123!` | 420 pts, 18 reports, Silver 🥈 tier |
| **Citizen (Platinum)** | Ananya Patel | `ananya@civicai.org` | `Password123!` | 1,540 pts, 42 reports, Platinum 💎 tier |
| **Citizen (Champion)** | Priya Nair | `priya@civicai.org` | `Password123!` | 2,340 pts, 65 reports, Champion 🏆 tier |
| **Officer (Roads)** | Inspector Vikram Rao | `officer@civicai.org` | `Officer123!` | Head Officer, Road Maintenance |
| **Officer (Sanitation)**| Officer Meera Sen | `sanitation@civicai.org` | `Officer123!` | Sanitation & Waste Department |
| **Administrator** | Rajesh Kumar | `admin@civicai.org` | `Admin123!` | Chief System Administrator |

---

## 3. Architecture & Project Structure

CivicAI separates concerns across clear modular layers:

```
SIH/
├── package.json                   # Root orchestrator scripts
├── server/
│   ├── index.js                   # Express server entrypoint
│   ├── .env                       # Environment variables
│   ├── .env.example               # Example config
│   ├── config/
│   │   ├── db.js                  # Resilient DB manager (URI or embedded fallback)
│   │   └── constants.js           # Default ranks, point rules, categories
│   ├── models/
│   │   ├── User.js                # Users, roles, points, ranks
│   │   ├── Complaint.js           # Comprehensive complaint schema
│   │   ├── MasterIssue.js         # De-duplication clusters
│   │   ├── Department.js          # Municipal departments
│   │   ├── IssueCategory.js       # Configurable defect categories
│   │   ├── Notification.js        # In-app alerts
│   │   ├── PointTransaction.js    # Immutable points audit ledger
│   │   └── SystemSetting.js       # Dynamic DB settings
│   ├── services/
│   │   ├── aiService.js           # Pluggable AI engine (Mock / Gemini / OpenAI)
│   │   ├── duplicateDetectionService.js # Haversine geo-clustering (50m-75m)
│   │   ├── priorityService.js     # Multi-factor priority calculator
│   │   ├── rankingService.js      # Quality points & anti-spam calculator
│   │   └── storageService.js      # Local disk / Cloud S3 storage abstraction
│   ├── controllers/               # Express request handlers
│   ├── routes/                    # API route definitions
│   ├── middleware/                # JWT auth, role RBAC, upload, error handler
│   ├── seeds/
│   │   └── seedData.js            # Realistic database seeder
│   └── tests/
│       └── api.test.js            # Automated verification test suite
└── client/
    ├── index.html                 # HTML shell with Leaflet stylesheet
    ├── vite.config.js             # Vite config with backend proxy
    ├── tailwind.config.js         # Theme styling
    └── src/
        ├── App.jsx                # React Router & ProtectedRoute setup
        ├── main.jsx               # React DOM root
        ├── api/                   # Modular Axios API service layer
        ├── context/               # AuthContext & NotificationContext
        ├── components/
        │   ├── common/            # Navbar, Footer, ProtectedRoute
        │   ├── complaint/         # PriorityBadge, StatusBadge, Timeline, BeforeAfterViewer
        │   └── map/               # InteractiveMap, LocationPicker
        └── pages/
            ├── LandingPage.jsx
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── PublicMapPage.jsx
            ├── citizen/           # ReportIssuePage, CitizenDashboard, MyComplaints, Leaderboard, Detail
            ├── officer/           # OfficerDashboard, OfficerComplaintDetailPage
            └── admin/             # AdminSettingsPage
```

---

## 4. Technologies Used

- **Frontend**: React.js (v18), Vite, Tailwind CSS, Lucide Icons, Leaflet & React-Leaflet (interactive OpenStreetMap maps), Recharts (officer metrics charts), Axios.
- **Backend**: Node.js, Express.js (REST API architecture).
- **Database**: MongoDB with Mongoose ODM (includes embedded zero-setup engine via `mongodb-memory-server` with persistent storage fallback).
- **Authentication**: JWT (JSON Web Tokens), bcrypt password hashing, role-based authorization middleware (`CITIZEN`, `OFFICER`, `ADMIN`).
- **File Uploads**: Multer with file type validation and local/cloud storage abstraction.
- **Geocoding**: OpenStreetMap Nominatim reverse-geocoding API.

---

## 5. Prerequisites & Zero-Config Database

- **Node.js**: v18+ or v20+ recommended.
- **MongoDB**: 
  - **No external MongoDB install is strictly required!** If `MONGODB_URI` is not set or local mongod is not running, CivicAI automatically spins up an embedded MongoDB engine out of the box with zero configuration!
  - If you have an existing MongoDB instance or MongoDB Atlas cluster, simply supply `MONGODB_URI` in `server/.env`.

---

## 6. Installation & Setup

Clone or open the repository, then run from the project root:

```bash
# Install root, server, and client dependencies
npm run install:all
```

Or install manually:
```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

---

## 7. Running the Application

### Option A: Run Both Frontend & Backend Concurrently (Recommended)
```bash
npm run dev
```

### Option B: Run Server and Client in Separate Terminals
**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
```
*Backend runs on `http://localhost:5001` (health check at `http://localhost:5001/api/health`).*

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### Re-seeding Demo Data
```bash
npm run seed --prefix server
```

### Running Automated Test Suite
```bash
npm test --prefix server
```

---

## 8. API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register citizen account
- `POST /api/auth/login` - Authenticate and receive JWT token
- `GET /api/auth/me` - Get profile and rank progression
- `PUT /api/auth/profile` - Update display profile

### Complaints (`/api/complaints`)
- `GET /api/complaints` - Query issues with filters (`status`, `priority`, `category`, `search`)
- `POST /api/complaints` - Submit a new complaint (multipart/form-data)
- `GET /api/complaints/:id` - Get full details, timeline, and location
- `GET /api/complaints/nearby` - Pre-submission proximity check (`lat`, `lon`, `radius`)
- `PATCH /api/complaints/:id/status` - Officer/Admin workflow status progression
- `POST /api/complaints/:id/resolve` - Officer uploads resolution photo & marks resolved
- `POST /api/complaints/:id/notes` - Add internal officer field note

### AI Computer Vision (`/api/ai`)
- `POST /api/ai/analyze` - Upload image for category classification & confidence score
- `POST /api/ai/verify-resolution` - Compare Before vs After photos and verify repair quality

### Operations & Governance
- `GET /api/officer/stats` - Departmental KPIs and charts
- `GET /api/leaderboard` - Civic contributor standings (weekly/monthly/all-time)
- `GET /api/notifications` - Citizen and officer notification alerts
- `GET /api/admin/overview` - Platform overview metrics
- `GET /api/admin/settings` - Retrieve dynamic point rules and rank definitions
- `PUT /api/admin/settings` - Modify point rules and rank tiers in the database

---

## 9. AI Service Layer & Integration

The AI service layer resides in [`server/services/aiService.js`](file:///Users/swadhansundar/Documents/SIH/server/services/aiService.js).

### Current Mode: Heuristic & Pattern Engine
Out of the box, CivicAI operates in demo mode using an intelligent heuristic classifier that produces realistic confidence scores (75%–99%), defect categories, and Before vs After resolution verification.

### Connecting Live Cloud Vision AI
To plug in live multimodal AI:
1. Open `server/.env`.
2. Add your Gemini or OpenAI API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   # or
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. The `AIService` constructor automatically detects the key and switches to the live vision provider without changing any controllers or frontend code.

---

## 10. Duplicate Detection & Clustering Engine

The duplicate detection engine resides in [`server/services/duplicateDetectionService.js`](file:///Users/swadhansundar/Documents/SIH/server/services/duplicateDetectionService.js).

1. When a citizen submits a complaint, the backend computes the Haversine distance between coordinates and active issues of the same category.
2. If another report is located within **75 meters**:
   - It links the new report to a `MasterIssue`.
   - The master issue increments `citizenReportCount`.
   - Priority escalates based on community impact (e.g., 5+ reports escalate to `HIGH` or `CRITICAL`).
   - The corroborating citizen receives a duplicate acknowledgement with **0 spam points**, preventing users from gaming the leaderboard.

---

## 11. Civic Contributor Ranking & Anti-Spam Engine

Located in [`server/services/rankingService.js`](file:///Users/swadhansundar/Documents/SIH/server/services/rankingService.js).

### Point Allocation Rules
- **Valid Issue Accepted**: `+20 points`
- **Officer Confirmed**: `+30 points`
- **Issue Successfully Resolved**: `+40 points`
- **Unique Issue Discovery**: `+20 points`
- **Multiple Citizens Confirming**: `+10 points`
- **Duplicate Report**: `0 points` (prevents photo flooding spam)
- **Rejected / Fake Report**: `-20 points` (penalty for abuse)

### Contributor Ranks
1. 🌱 **Beginner**: 0–99 pts
2. 🥉 **Bronze Contributor**: 100–249 pts
3. 🥈 **Silver Contributor**: 250–499 pts
4. 🥇 **Gold Contributor**: 500–999 pts
5. 💎 **Platinum Contributor**: 1000–1999 pts
6. 🏆 **Civic Champion**: 2000+ pts

All rules and rank point thresholds can be edited dynamically in the Admin Panel without changing code.

---

## 12. Extending & Adding New Features

CivicAI is structured to make future enhancements seamless:

- **Add a New Issue Category**: Add an entry via the admin API or `server/config/constants.js`. The database-driven routing will immediately reflect it across the frontend wizard and map filters.
- **Switch to AWS S3 or Cloud Storage**: In `server/services/storageService.js`, enable the `S3StorageProvider` by setting `AWS_S3_BUCKET` in `.env`.
- **Integrate WhatsApp or SMS Alerts**: Hook into `server/services/rankingService.js` or `server/controllers/complaintController.js` inside the status update block.

---

## 13. Troubleshooting & Known Limitations

- **Port 5000 in use on macOS**: On macOS Monterey/Ventura/Sonoma/Sequoia, port 5000 is occupied by Apple's AirPlay Receiver. CivicAI backend defaults to **port 5001** to avoid this issue.
- **Location Permission in Browser**: If location permission is denied by the user, the Report wizard displays a helpful message and allows the citizen to simply click or drag the map pin to select the defect location manually.
- **Photos in Demo Mode**: Images uploaded through the wizard are saved locally to `server/uploads/` and served via static URL.
