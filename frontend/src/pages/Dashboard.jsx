import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PomodoroTimer from "../components/PomodoroTimer";
import { CheckSquare, BookOpen, MessageSquare, TrendingUp, ArrowRight } from "lucide-react";

// 🔥 NEW IMPORT: Get the Task Context
import { useTasks } from "../context/TaskContext"; 

export default function Dashboard() {
  const navigate = useNavigate();
  // 🔥 REMOVED: local state for todayTasks and the second fetch
  // 🔥 REMOVED: const [todayTasks, setTodayTasks] = useState([]);

  const [pomodoroStats, setPomodoroStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    weekSessions: 0
  });
  const [loading, setLoading] = useState(true);

  // 🔥 NEW: Consume Task Context
  const { tasks, getTasksDueToday, loading: tasksLoading } = useTasks();

  // DERIVED STATE: Filter tasks locally using the context's full task list
  const todayTasks = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    const today = new Date().toDateString();
    return new Date(task.dueDate).toDateString() === today;
  });

  // ============================================
  // FETCH DASHBOARD DATA (Only Pomodoro Stats)
  // ============================================
  
  // Use useCallback to ensure fetchDashboardData has a stable identity
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch pomodoro stats (This remains local as it's Dashboard specific)
      const statsRes = await fetch("http://localhost:5000/api/pomodoro/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setPomodoroStats(statsData);
      } else {
         console.error("Failed to fetch pomodoro stats");
      }

      // 🔥 REMOVED: Logic to fetch and filter today's tasks is now handled by TaskContext

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  }, []); // Empty dependency array as it only fetches stats (not task dependent)

  
  // Initial fetch for Pomodoro Stats
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  // ============================================
  // HANDLE POMODORO SESSION COMPLETION
  // ============================================
  
  /**
   * Called when a pomodoro session completes
   */
  async function handleSessionComplete(sessionData) {
    console.log("🍅 Pomodoro session completed:", sessionData);
    
    try {
      const token = localStorage.getItem("token");
      
      // ✅ Save session to backend
      const res = await fetch("http://localhost:5000/api/pomodoro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(sessionData)
      });

      if (res.ok) {
        const result = await res.json();
        console.log("✅ Session saved to database:", result);
        
        // ✅ Refresh dashboard stats after successful save
        fetchDashboardData();
        
      } else {
        const error = await res.json();
        console.error("❌ Failed to save session:", error);
      }
    } catch (error) {
      console.error("❌ Error saving session:", error);
    }
  }

  // ============================================
  // QUICK LINKS CONFIGURATION (No change)
  // ============================================
  
  const quickLinks = [
    // ... (quickLinks configuration remains the same) ...
    {
      title: "Manage Tasks",
      description: "Create and track your study tasks",
      icon: CheckSquare,
      path: "/tasks",
      color: "bg-blue-500"
    },
    {
      title: "Study Materials",
      description: "Upload and organize your notes",
      icon: BookOpen,
      path: "/materials",
      color: "bg-green-500"
    },
    {
      title: "Community Forum",
      description: "Connect with other students",
      icon: MessageSquare,
      path: "/forum",
      color: "bg-purple-500"
    },
    {
      title: "View Analytics",
      description: "Track your productivity stats",
      icon: TrendingUp,
      path: "/analytics",
      color: "bg-orange-500"
    }
  ];

  // Combine loading states for a better UX
  const dashboardLoading = loading || tasksLoading;

  // ============================================
  // RENDER (Updates to use todayTasks derived from Context)
  // ============================================

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Welcome Card */}
        <div className="rounded-2xl p-6 bg-white dark:bg-[#121318] shadow-md">
          <h2 className="text-2xl font-semibold mb-2">Welcome back! 👋</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ready to focus and be productive today?
          </p>
        </div>

        {/* Quick Links Grid (No change) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="p-5 rounded-2xl bg-white dark:bg-[#121318] shadow-md hover:shadow-lg transition-all hover:scale-[1.02] text-left group"
              >
                <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="text-white" size={24} />
                </div>
                <h3 className="font-semibold mb-1 flex items-center justify-between">
                  {link.title}
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {link.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Today's Tasks Preview - USES Context Data */}
        <div className="rounded-2xl p-6 bg-white dark:bg-[#121318] shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Today's Tasks</h3>
            <button
              onClick={() => navigate("/tasks")}
              className="text-sm text-accent hover:underline"
            >
              View all →
            </button>
          </div>
          
          {dashboardLoading ? ( // Use combined loading state
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          ) : todayTasks.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No tasks due today. <span 
                className="text-accent cursor-pointer hover:underline"
                onClick={() => navigate("/tasks")}
              >
                Create your first task
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {todayTasks.slice(0, 3).map(task => (
                <div
                  key={task._id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] hover:bg-gray-100 dark:hover:bg-[#0f1218] transition cursor-pointer"
                  onClick={() => navigate("/tasks")}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    task.completed ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className={`text-sm flex-1 ${
                    task.completed ? 'line-through text-gray-400' : ''
                  }`}>
                    {task.title}
                  </span>
                  {task.pomodoroSessions > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      🍅 {task.pomodoroSessions}
                    </span>
                  )}
                </div>
              ))}
              {todayTasks.length > 3 && (
                <button
                  onClick={() => navigate("/tasks")}
                  className="text-xs text-accent hover:underline w-full text-center py-2"
                >
                  +{todayTasks.length - 3} more tasks
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        {/* Pomodoro Timer with Session Saving */}
        <PomodoroTimer onSessionComplete={handleSessionComplete} />
        
        {/* Quick Stats - USES Context Data for Tasks */}
        <div className="rounded-2xl p-4 bg-white dark:bg-[#121318] shadow-md">
          <h4 className="font-semibold mb-3">Quick Stats</h4>
          <div className="space-y-3">
            {/* 🔥 NOW USES todayTasks DERIVED FROM CONTEXT */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tasks Today</span>
              <span className="font-semibold">{todayTasks.length}</span> 
            </div>
            {/* The rest of the stats remain the same, using local pomodoroStats */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Focus Time</span>
              <span className="font-semibold">
                {dashboardLoading ? '...' : `${Math.floor(pomodoroStats.totalMinutes / 60)}h ${pomodoroStats.totalMinutes % 60}m`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">This Week</span>
              <span className="font-semibold">
                {dashboardLoading ? '...' : `🍅 ${pomodoroStats.weekSessions} sessions`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</span>
              <span className="font-semibold">
                {dashboardLoading ? '...' : `${pomodoroStats.totalSessions}`}
              </span>
            </div>
          </div>
        </div>

        {/* Productivity Tip */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20">
          <h4 className="font-semibold mb-2 text-sm">💡 Pro Tip</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Link your Pomodoro sessions to specific tasks to track time spent and stay organized!
          </p>
        </div>
      </aside>
    </div>
  );
}