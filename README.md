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

**FocusHub** is a premium, full-stack productivity and collaboration platform designed for students and professionals. It goes far beyond standard task management by heavily integrating advanced features like **Real-Time WebSocket Chatting**, **Two-Way Google Calendar Sync**, and a robust **Razorpay Subscription Gateway**.

Built with scalability and absolute zero-latency user experience in mind, FocusHub utilizes **Optimistic UI updates**, secure **OAuth2 flows**, and highly optimized RESTful architectures to deliver a seamless, state-of-the-art experience.

---

## 🚀 Live Deployment

- **Frontend Application:** [https://focushub-frontend.onrender.com](https://focushub-frontend.onrender.com)
- **Backend API:** [https://focushub-backend-r5vc.onrender.com](https://focushub-backend-r5vc.onrender.com)

*(Note: Hosted on Render's free tier. The backend may take ~50 seconds to spin up on the very first request if inactive).*

---

## ✨ Key Features & Technical Highlights

### 1. 💬 Real-Time Collaboration (WebSockets)
- Integrated real-time chatting powered by **Socket.io** / WebSockets.
- Instantaneous message delivery and live presence tracking for seamless student and team collaboration.

### 2. 📅 Google Calendar Two-Way Sync (Pro Feature)
- Secure **Google OAuth2** offline access token retrieval.
- Automatically pushes tasks and deadlines directly into the user's primary Google Calendar.
- Robust timezone-offset management strictly adhering to ISO-8601 UTC standards to guarantee pixel-perfect scheduling across the globe.

### 3. 💳 Razorpay Subscription Engine (Payment Gateway)
- Dynamic monetization tiering system (`Free`, `Pro`, `Yearly`).
- Validates payment handshakes securely between the frontend UI and the Node.js backend using cryptographic HMAC-SHA256 signatures.
- Background cron jobs gracefully downgrade users when their subscription time expires.

### 4. ⚡ Zero-Latency Optimistic UI
- Task creation, updates, toggles, and deletions use advanced Optimistic UI state modifications in React Contexts.
- Provides **absolute 0ms latency** on user interactions while safely syncing with the database in the background.

### 5. 🍅 Intelligent Pomodoro Engine
- Absolute time-engine impervious to browser background-tab throttling.
- Integrates native **Web Audio API** oscillators to bypass strict browser autoplay security for reliable alarm sounds.
- Browser-native **Push Notifications** when a focus or break session finishes.

### 6. ☁️ Secure Cloud Storage
- Integrates with **Cloudinary** for scalable study material and file storage.
- Handles direct buffer uploads, generating secure, expiring signed URLs for instant PDF and Image previews directly in the browser.

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
