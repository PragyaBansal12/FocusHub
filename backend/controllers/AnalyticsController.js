import Task from "../models/Task.js";
import Pomodoro from "../models/Pomodoro.js";

// ============================================
// FOCUS TIME ANALYTICS
// ============================================

/**
 * Get daily focus time for the past N days
 */
export async function getFocusTime(req, res) {
  try {
    const { days = 30 } = req.query;
    const userId = req.userId;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // Get all focus sessions in date range
    const sessions = await Pomodoro.find({
      user: userId,
      type: 'focus',
      completedAt: { $gte: startDate }
    }).sort({ completedAt: 1 });

    // Group by date
    const dailyData = {};
    sessions.forEach(session => {
      const date = new Date(session.completedAt).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, hours: 0, sessions: 0 };
      }
      dailyData[date].hours += session.duration / 3600; // Convert seconds to hours
      dailyData[date].sessions += 1;
    });

    // Fill in missing dates with 0
    const data = [];
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      data.push(dailyData[dateStr] || {
        date: dateStr,
        hours: 0,
        sessions: 0
      });
    }

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;

    res.json({
      data,
      totalMinutes: Math.round(totalMinutes),
      totalSessions: sessions.length
    });
  } catch (err) {
    console.error('Error fetching focus time:', err);
    res.status(500).json({ message: 'Error fetching focus time', error: err.message });
  }
}

// ============================================
// TASK ANALYTICS
// ============================================

/**
 * Get task statistics
 */
export async function getTaskAnalytics(req, res) {
  try {
    const userId = req.userId;

    // Get all tasks
    const tasks = await Task.find({ user: userId });

    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Count by priority
    const tasksByPriority = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };

    res.json({
      taskStats: {
        total,
        completed,
        pending,
        completionRate
      },
      tasksByPriority
    });
  } catch (err) {
    console.error('Error fetching task analytics:', err);
    res.status(500).json({ message: 'Error fetching task analytics', error: err.message });
  }
}

// ============================================
// POMODORO ANALYTICS
// ============================================

/**
 * Get pomodoro sessions breakdown
 */
export async function getPomodoroSessions(req, res) {
  try {
    const { days = 7 } = req.query;
    const userId = req.userId;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // Get sessions
    const sessions = await Pomodoro.find({
      user: userId,
      type: 'focus',
      completedAt: { $gte: startDate }
    }).sort({ completedAt: 1 });

    // Group by day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = {};
    
    sessions.forEach(session => {
      const date = new Date(session.completedAt);
      const dayName = dayNames[date.getDay()];
      dailyData[dayName] = (dailyData[dayName] || 0) + 1;
    });

    // Format for chart
    const data = dayNames.map(day => ({
      day,
      sessions: dailyData[day] || 0
    }));

    // Productivity by hour (0-23)
    const hourlyData = Array(24).fill(0);
    sessions.forEach(session => {
      const hour = new Date(session.completedAt).getHours();
      hourlyData[hour] += 1;
    });

    const productivityByHour = hourlyData
      .map((count, hour) => ({
        hour: `${hour}:00`,
        sessions: count
      }))
      .filter(item => item.sessions > 0); // Only show hours with activity

    const mostProductiveHour = hourlyData.indexOf(Math.max(...hourlyData));

    // Calculate streak
    const streakData = calculateStreak(sessions);

    res.json({
      data,
      productivityByHour,
      mostProductiveHour: mostProductiveHour !== -1 ? `${mostProductiveHour}:00` : null,
      avgPerDay: sessions.length / parseInt(days),
      streakData
    });
  } catch (err) {
    console.error('Error fetching pomodoro sessions:', err);
    res.status(500).json({ message: 'Error fetching pomodoro sessions', error: err.message });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate current and longest streak
 */
function calculateStreak(sessions) {
  if (sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
  }

  // Sort by date
  const dates = [...new Set(
    sessions.map(s => new Date(s.completedAt).toISOString().split('T')[0])
  )].sort();

  let currentStreak = 1;
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const dayDiff = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // Check if current streak is still active
  const lastDate = new Date(dates[dates.length - 1]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceLastSession = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

  if (daysSinceLastSession <= 1) {
    currentStreak = tempStreak;
  } else {
    currentStreak = 0;
  }

  return {
    currentStreak,
    longestStreak,
    lastActiveDate: dates[dates.length - 1]
  };
}