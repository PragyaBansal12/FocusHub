import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import mongoose from "mongoose"
import cookieParser from "cookie-parser"
import path from "path";
import { fileURLToPath } from "url"
import {createServer} from "http";
import {Server} from "socket.io";



import authRoutes from "./routes/authRoutes.js"
import taskRoutes from "./routes/taskRoutes.js"
import pomodoroRoutes from "./routes/pomodoroRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import analyticsRoutes from "./routes/AnalyticsRoutes.js";
import communityChatRoutes from "./routes/communityChatRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js"
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import cron from "./routes/cronRoutes.js";

import { setupSocketHandlers } from "./socket/socketHandler.js"
import { startScheduler } from "./services/schedulerService.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"; // Define frontend URL for clarity

// ===============================================
// 🔥 CRITICAL FIXES FOR COOKIE/AUTH/REDIRECT ISSUES
// ===============================================

// 1. CORS Configuration for Express API Routes
// This ensures the browser sends the 'token' cookie from port 5173 to port 5000.
app.use(cors({
    origin: FRONTEND_URL, // Allow requests only from your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"], // Define allowed HTTP methods
    credentials: true, // 🔥 FIX: MUST be true to accept and send cookies/JWT
}));

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  next();
});

// 2. Middleware setup
app.use(express.json()); // Parses incoming JSON requests
app.use(cookieParser()); // Parses cookies attached to requests

// ===============================================
// REST OF THE SERVER SETUP
// ===============================================

const httpServer = createServer(app);

// Socket.IO Setup (This part was already correct)
const io = new Server(httpServer, {
 cors: {
  origin: FRONTEND_URL,
  methods: ["GET", "POST"],
  credentials: true // Already correct for WebSocket
 }
});

setupSocketHandlers(io);

app.set('io', io);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Route Definitions
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/pomodoro", pomodoroRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/community", communityChatRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/messages",messageRoutes);
app.use("/api/user",userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/cron",cron);


const PORT = process.env.PORT || 5000;

// connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI, {
 useNewUrlParser: true,
 useUnifiedTopology: true
}).then(async() => {
 console.log("Connected to MongoDB");



 startScheduler();
 httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
 console.error("MongoDB connection error:", err.message);
});

