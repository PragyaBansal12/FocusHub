import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import mongoose from "mongoose"
import cookieParser from "cookie-parser"
import path from "path";
import { fileURLToPath } from "url"


import authRoutes from "./routes/authRoutes.js"
import taskRoutes from "./routes/taskRoutes.js"
import pomodoroRoutes from "./routes/pomodoroRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser())

app.use('/uploads',express.static(path.join(__dirname,'uploads')));


app.use("/api/auth",authRoutes);
app.use("/api/tasks",taskRoutes);
app.use("/api/pomodoro",pomodoroRoutes);
app.use("/api/materials",materialRoutes);


const PORT = process.env.PORT || 5000;

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error("MongoDB connection error:", err.message);
});