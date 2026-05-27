<div align="center">
  <img src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" width="0" height="0" /> <!-- Hidden trigger -->
  <h1>🎯 FocusHub</h1>
  <p><strong>The Ultimate Productivity & Study Management Platform</strong></p>
  
  <p>
    <a href="https://focushub-frontend.onrender.com"><strong>Live Demo</strong></a> · 
    <a href="#features"><strong>Explore Features</strong></a> · 
    <a href="#api-reference"><strong>API Reference</strong></a>
  </p>

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
</div>

<br />

## 🌟 Overview

In today's hyper-distracted digital world, maintaining deep focus and organizing fragmented study materials is harder than ever. **FocusHub** was engineered to solve this exact problem. It is not just another to-do list—it is a **premium, all-in-one productivity and collaboration ecosystem** meticulously designed for students, developers, and professionals who demand peak performance.

### Why FocusHub is the Best:
By consolidating scattered tools into a single, unified platform, FocusHub eliminates context switching. It seamlessly blends **Intelligent Pomodoro Tracking**, **Secure Cloud Material Storage**, and **Google Calendar Sync** with **Real-Time Community WebSockets** for collaborative learning. 


## 🚀 Live Deployment

- **Frontend Application:** [https://focushub-frontend.onrender.com](https://focushub-frontend.onrender.com)
- **Backend API:** [https://focushub-backend-r5vc.onrender.com](https://focushub-backend-r5vc.onrender.com)

*(Note: Hosted on Render's free tier. The backend may take ~50 seconds to spin up on the very first request if inactive).*

---

## 🌟 Key Features
- 🔑 **Google Login & Signup**: Frictionless one-tap Google SSO alongside secure email authentication for seamless onboarding.
- ⏱️ **Intelligent Pomodoro Dashboard**: Full-fledged dashboard featuring customizable Pomodoro timer settings designed specifically for optimized focus study sessions.
- 📅 **Google Calendar Sync**: Seamless one-way synchronization pushing tasks and strict deadlines directly into the user's primary Google Calendar via OAuth2.
- 📣 **Automated Email Reminders**: Nodemailer-driven alerts automatically notifying users of overdue and highly prioritized tasks.
- 💬 **Real-Time Collaboration**: Integrated WebSockets enabling instant community discussions and personal chats for healthy, collaborative learning.
- 💳 **Integrated Payment Gateway**: Seamless Razorpay online payment integration allowing users to upgrade accounts and subscribe to Pro tiers.
- ⚡ **Zero-Latency Optimistic UI**: Tasks and resources update instantly (0ms latency) on the interface while safely resolving database transactions in the background.
- ☁️ **Cloudinary Media Pipeline**: Direct file uploading via Multer for study materials, generating secure, expiring URLs for instant previews.
- 📈 **Comprehensive Analytics Dashboard**: Fully interactive charts and data visualizations tracking daily focus time and completed tasks to monitor long-term productivity progress.

---

## 🛠️ Technology Stack

### Frontend Architecture
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS (Dark/Light mode support, Glassmorphism, Micro-animations)
- **State Management:** React Context API (`AuthContext`, `TaskContext`, `DashboardContext`, `MaterialsContext`)
- **Routing:** React Router v6
- **Icons:** Lucide React

### Backend Architecture
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ORM)
- **Authentication:** JSON Web Tokens (JWT) & Google OAuth2
- **File Processing:** Multer & Cloudinary API
- **Payment Gateway:** Razorpay SDK

---

## 📂 Project Directory Structure

```text
FocusHub/
├── backend/
│   ├── config/           # Database and third-party API configurations
│   ├── controllers/      # Route controllers (auth, tasks, calendar, materials, subscription)
│   ├── middleware/       # JWT auth validation and error handling
│   ├── models/           # MongoDB Mongoose schemas (User, Task, Material)
│   ├── routes/           # Express API route definitions
│   ├── services/         # Business logic (Nodemailer alerts, Cloudinary uploads)
│   ├── socket/           # WebSocket real-time chat event handlers
│   └── index.js          # Main Express server entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI elements (Pomodoro Timer, Navbar, Modals)
│   │   ├── context/      # React Contexts for Zero-Latency Optimistic UI updates
│   │   ├── pages/        # Main application views (Dashboard, Tasks, Chat, Materials)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Helper functions (time formatting, API wrappers)
│   │   └── App.jsx       # React Router layout and protected routes guarding
│   └── index.html        # Vite entry HTML
└── README.md
```

---

## 🔌 API Reference

The backend exposes a highly structured REST API. Here are the core endpoints:

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate & receive HTTP-only JWT cookie
- `GET /api/auth/me` - Retrieve current session user data
- `POST /api/auth/google` - One-tap Google SSO login

### Tasks
- `GET /api/tasks` - Fetch all active tasks
- `POST /api/tasks` - Create a new task (auto-generates Google Calendar event if synced)
- `PUT /api/tasks/:id` - Update task details & timezone-accurate due dates
- `PATCH /api/tasks/:id/toggle` - Mark task as complete/incomplete
- `DELETE /api/tasks/:id` - Remove a task

### Pomodoro & Analytics
- `GET /api/analytics` - Fetch aggregated 7-day user activity graphs
- `POST /api/pomodoro/complete` - Log a completed focus session duration

### Materials (Storage)
- `GET /api/materials` - List uploaded files with tag/type filters
- `POST /api/materials` - `multipart/form-data` upload to Cloudinary
- `DELETE /api/materials/:id` - Permanently delete a resource from cloud bucket

### Subscriptions & Integrations
- `POST /api/subscription/create-order` - Initialize Razorpay order
- `POST /api/subscription/verify-payment` - Cryptographically verify payment signature
- `GET /api/calendar/google` - Generates Google OAuth consent screen URL
- `GET /api/calendar/google/callback` - Callback handler for OAuth code exchange

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- Cloudinary Account
- Razorpay Account
- Google Cloud Console Project (for OAuth)

### 1. Clone the Repository
```bash
git clone https://github.com/PragyaBansal12/FocusHub.git
cd FocusHub
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```
Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000
```
Start the frontend:
```bash
npm run dev
```

---

## 🏗️ Design Decisions & Architecture Notes
- **Security:** JWTs are stored in `HTTP-Only`, `Secure` cookies to prevent XSS attacks.
- **CORS Management:** Custom dynamic CORS configurations strictly bind the backend to the verified frontend domain.
- **Resilience:** If the database connection drops or a third-party API (like Google Calendar) fails, the backend catches the error gracefully, unlinks the sync securely, and returns a sanitized error code to the UI.

---
<div align="center">
  <i>Built with ❤️ for peak productivity.</i>
</div>
