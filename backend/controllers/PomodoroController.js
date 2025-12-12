import Pomodoro from "../models/Pomodoro.js";
import Task from "../models/Task.js";

// ✅ Save a completed pomodoro session
export async function saveSession(req, res) {
  try {
    console.log("📥 Saving pomodoro session");
    
    const { taskId, duration, type, completedAt } = req.body;

    // Create pomodoro session
    const session = await Pomodoro.create({
      user: req.userId,
      task: taskId || null,
      duration,
      type,
      completedAt
    });

    // ✅ If linked to a task, update task's pomodoro count and time spent
    if (taskId && type === 'focus') {
      const task = await Task.findOne({ _id: taskId, user: req.userId });
      
      if (task) {
        task.pomodoroSessions += 1;
        task.timeSpent += Math.floor(duration / 60); // Convert to minutes
        await task.save();
        console.log(`✅ Updated task ${taskId}: +1 session, +${Math.floor(duration / 60)} minutes`);
      }
    }

    console.log("✅ Pomodoro session saved");
    
    res.status(201).json({ 
      message: "Session saved", 
      session 
    });
  } catch (err) {
    console.error("❌ Error saving session:", err);
    res.status(500).json({ 
      message: "Error saving session", 
      error: err.message 
    });
  }
}

// ✅ Get user's pomodoro history
export async function getSessions(req, res) {
  try {
    const { startDate, endDate, type } = req.query;
    
    const filter = { user: req.userId };
    
    // Filter by date range if provided
    if (startDate || endDate) {
      filter.completedAt = {};
      if (startDate) filter.completedAt.$gte = new Date(startDate);
      if (endDate) filter.completedAt.$lte = new Date(endDate);
    }
    
    // Filter by type if provided
    if (type) filter.type = type;

    const sessions = await Pomodoro.find(filter)
      .populate('task', 'title') // Include task title
      .sort({ completedAt: -1 });

    res.json({ sessions });
  } catch (err) {
    console.error("❌ Error fetching sessions:", err);
    res.status(500).json({ 
      message: "Error fetching sessions", 
      error: err.message 
    });
  }
}

// ✅ Get pomodoro statistics
export async function getStats(req, res) {
  try {
    const userId = req.userId;

    // Total sessions
    const totalSessions = await Pomodoro.countDocuments({ 
      user: userId, 
      type: 'focus' 
    });

    // Total focus time (in minutes)
    const sessions = await Pomodoro.find({ user: userId, type: 'focus' });
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;

    // Sessions this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekSessions = await Pomodoro.countDocuments({
      user: userId,
      type: 'focus',
      completedAt: { $gte: weekAgo }
    });

    res.json({
      totalSessions,
      totalMinutes: Math.floor(totalMinutes),
      weekSessions
    });
  } catch (err) {
    console.error("❌ Error fetching stats:", err);
    res.status(500).json({ 
      message: "Error fetching stats", 
      error: err.message 
    });
  }
}