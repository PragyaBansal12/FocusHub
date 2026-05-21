import Task from "../models/Task.js";
import Pomodoro from "../models/Pomodoro.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Clamp a query-param integer to a safe range */
const parsePositiveInt = (value, defaultVal, max = 365) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return defaultVal;
  return Math.min(n, max);
};

/** Build a UTC Date for N days ago at midnight */
const daysAgoMidnight = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─────────────────────────────────────────────
// FOCUS TIME  (daily breakdown for past N days)
// ─────────────────────────────────────────────

export async function getFocusTime(req, res) {
  try {
    const userId = req.user?.id; // ✅ FIX: was req.userId (always undefined)
    if (!userId) return res.status(401).json({ message: "Unauthorised" });

    const days = parsePositiveInt(req.query.days, 30, 365);
    const startDate = daysAgoMidnight(days);

    // ── Aggregation pipeline – group by date string, sum duration ──
    const rawData = await Pomodoro.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          type: "focus",
          completedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$completedAt" },
          },
          totalSeconds: { $sum: "$duration" },
          sessions: { $sum: 1 },
        },
      },
    ]);

    // Index by date for O(1) lookup when filling gaps
    const byDate = {};
    let totalSeconds = 0;
    let totalSessions = 0;
    for (const row of rawData) {
      byDate[row._id] = row;
      totalSeconds += row.totalSeconds;
      totalSessions += row.sessions;
    }

    // Fill every calendar day in the range (including days with 0 activity)
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const row = byDate[dateStr];
      data.push({
        date: dateStr,
        hours: row ? parseFloat((row.totalSeconds / 3600).toFixed(2)) : 0,
        sessions: row ? row.sessions : 0,
      });
    }

    return res.json({
      data,
      totalMinutes: Math.round(totalSeconds / 60),
      totalSessions,
    });
  } catch (err) {
    console.error("Error fetching focus time:", err);
    return res.status(500).json({ message: "Error fetching focus time", error: err.message });
  }
}

// ─────────────────────────────────────────────
// TASK ANALYTICS
// ─────────────────────────────────────────────

export async function getTaskAnalytics(req, res) {
  try {
    const userId = req.user?.id; // ✅ FIX
    if (!userId) return res.status(401).json({ message: "Unauthorised" });

    // ── Single aggregation instead of fetching all tasks into JS ──
    const [result] = await Task.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ["$completed", 1, 0] } },
          highPriority: {
            $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
          },
          mediumPriority: {
            $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] },
          },
          lowPriority: {
            $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] },
          },
        },
      },
    ]);

    const total = result?.total ?? 0;
    const completed = result?.completed ?? 0;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.json({
      taskStats: { total, completed, pending, completionRate },
      tasksByPriority: {
        high: result?.highPriority ?? 0,
        medium: result?.mediumPriority ?? 0,
        low: result?.lowPriority ?? 0,
      },
    });
  } catch (err) {
    console.error("Error fetching task analytics:", err);
    return res.status(500).json({ message: "Error fetching task analytics", error: err.message });
  }
}

// ─────────────────────────────────────────────
// POMODORO SESSION BREAKDOWN
// ─────────────────────────────────────────────

export async function getPomodoroSessions(req, res) {
  try {
    const userId = req.user?.id; // ✅ FIX
    if (!userId) return res.status(401).json({ message: "Unauthorised" });

    const days = parsePositiveInt(req.query.days, 7, 90);
    const startDate = daysAgoMidnight(days);

    // ── Single aggregation for day-of-week and hourly breakdowns ──
    const rawData = await Pomodoro.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          type: "focus",
          completedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
            dayOfWeek: { $dayOfWeek: "$completedAt" }, // 1=Sun … 7=Sat
            hour: { $hour: "$completedAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // ── Day-of-week summary ──
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayTotals = new Array(7).fill(0);
    const hourTotals = new Array(24).fill(0);
    const uniqueDates = new Set();

    for (const row of rawData) {
      const dow = row._id.dayOfWeek - 1; // convert 1-7 → 0-6
      dayTotals[dow] += row.count;
      hourTotals[row._id.hour] += row.count;
      uniqueDates.add(row._id.date);
    }

    const data = DAY_NAMES.map((day, i) => ({ day, sessions: dayTotals[i] }));

    const productivityByHour = hourTotals
      .map((count, hour) => ({ hour: `${hour}:00`, sessions: count }))
      .filter((h) => h.sessions > 0);

    const maxHourVal = Math.max(...hourTotals);
    const mostProductiveHour =
      maxHourVal > 0 ? `${hourTotals.indexOf(maxHourVal)}:00` : null;

    const totalSessions = hourTotals.reduce((a, b) => a + b, 0);
    const avgPerDay = days > 0 ? parseFloat((totalSessions / days).toFixed(2)) : 0;

    // ── Streak calculation (works on unique date strings) ──
    const streakData = calculateStreak(Array.from(uniqueDates));

    return res.json({
      data,
      productivityByHour,
      mostProductiveHour,
      avgPerDay,
      streakData,
    });
  } catch (err) {
    console.error("Error fetching pomodoro sessions:", err);
    return res.status(500).json({ message: "Error fetching pomodoro sessions", error: err.message });
  }
}

// ─────────────────────────────────────────────
// HELPER — streak calculation
// ─────────────────────────────────────────────

function calculateStreak(dateStrings) {
  if (!dateStrings.length) {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
  }

  const dates = [...new Set(dateStrings)].sort(); // unique & ascending

  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((curr - prev) / 86_400_000);
    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // Is the streak still active? (last session was today or yesterday)
  const lastDate = new Date(dates[dates.length - 1]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceLast = Math.round((today - lastDate) / 86_400_000);

  const currentStreak = daysSinceLast <= 1 ? tempStreak : 0;

  return {
    currentStreak,
    longestStreak,
    lastActiveDate: dates[dates.length - 1],
  };
}
