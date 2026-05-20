import Pomodoro from "../models/Pomodoro.js";
import Task from "../models/Task.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Safely parse a positive integer from a query param; returns the default if invalid. */
const parsePositiveInt = (value, defaultVal, max = 365) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return defaultVal;
  return Math.min(n, max);
};

/** Validate session type */
const VALID_TYPES = new Set(["focus", "break"]);

// ─────────────────────────────────────────────
// SAVE SESSION
// ─────────────────────────────────────────────

export async function saveSession(req, res) {
  try {
    const userId = req.user?.id; // ✅ FIX: was req.userId (always undefined)
    if (!userId) {
      return res.status(401).json({ message: "Unauthorised" });
    }

    const { taskId, duration, type, completedAt } = req.body;

    // ── Input validation ──────────────────────
    if (!type || !VALID_TYPES.has(type)) {
      return res.status(400).json({ message: "type must be 'focus' or 'break'" });
    }

    const durationNum = Number(duration);
    if (!Number.isFinite(durationNum) || durationNum <= 0 || durationNum > 86400) {
      return res.status(400).json({ message: "duration must be a positive number of seconds (max 86400)" });
    }

    // Validate optional taskId
    if (taskId && !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "taskId is not a valid ObjectId" });
    }

    // Validate optional completedAt
    let completedAtDate = null;
    if (completedAt) {
      completedAtDate = new Date(completedAt);
      if (isNaN(completedAtDate.getTime())) {
        return res.status(400).json({ message: "completedAt is not a valid date" });
      }
    }

    // ── If taskId provided, verify ownership before touching the task ──
    let linkedTask = null;
    if (taskId && type === "focus") {
      linkedTask = await Task.findOne({ _id: taskId, user: userId });
      // Not finding it is non-fatal — we just won't update the task
    }

    // ── Create session ────────────────────────
    const session = await Pomodoro.create({
      user: userId,
      task: taskId || null,
      duration: durationNum,
      type,
      completedAt: completedAtDate || new Date(),
    });

    // ── Update linked task stats ──────────────
    if (linkedTask) {
      linkedTask.pomodoroSessions += 1;
      linkedTask.timeSpent += Math.floor(durationNum / 60); // seconds → minutes
      await linkedTask.save();
    }

    return res.status(201).json({ message: "Session saved", session });
  } catch (err) {
    console.error("❌ Error saving pomodoro session:", err);
    return res.status(500).json({ message: "Error saving session", error: err.message });
  }
}

// ─────────────────────────────────────────────
// GET SESSION HISTORY
// ─────────────────────────────────────────────

export async function getSessions(req, res) {
  try {
    const userId = req.user?.id; // ✅ FIX
    if (!userId) return res.status(401).json({ message: "Unauthorised" });

    const { startDate, endDate, type } = req.query;

    // ── Input validation ──────────────────────
    if (type && !VALID_TYPES.has(type)) {
      return res.status(400).json({ message: "type must be 'focus' or 'break'" });
    }

    const filter = { user: userId };

    if (startDate || endDate) {
      filter.completedAt = {};
      if (startDate) {
        const sd = new Date(startDate);
        if (isNaN(sd.getTime())) return res.status(400).json({ message: "startDate is invalid" });
        filter.completedAt.$gte = sd;
      }
      if (endDate) {
        const ed = new Date(endDate);
        if (isNaN(ed.getTime())) return res.status(400).json({ message: "endDate is invalid" });
        filter.completedAt.$lte = ed;
      }
    }

    if (type) filter.type = type;

    const sessions = await Pomodoro.find(filter)
      .populate("task", "title")
      .sort({ completedAt: -1 })
      .limit(500); // safety cap

    return res.json({ sessions });
  } catch (err) {
    console.error("❌ Error fetching sessions:", err);
    return res.status(500).json({ message: "Error fetching sessions", error: err.message });
  }
}

// ─────────────────────────────────────────────
// GET STATS (aggregation pipeline — no JS-side filtering)
// ─────────────────────────────────────────────

export async function getStats(req, res) {
  try {
    const userId = req.user?.id; // ✅ FIX
    if (!userId) return res.status(401).json({ message: "Unauthorised" });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    // Single aggregation instead of three separate queries
    const [result] = await Pomodoro.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), type: "focus" } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalDurationSeconds: { $sum: "$duration" },
          weekSessions: {
            $sum: {
              $cond: [{ $gte: ["$completedAt", weekAgo] }, 1, 0],
            },
          },
        },
      },
    ]);

    return res.json({
      totalSessions: result?.totalSessions ?? 0,
      totalMinutes: result ? Math.floor(result.totalDurationSeconds / 60) : 0,
      weekSessions: result?.weekSessions ?? 0,
    });
  } catch (err) {
    console.error("❌ Error fetching pomodoro stats:", err);
    return res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
}
