import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PomodoroTimer from "../components/PomodoroTimer";
import { CheckSquare, BookOpen, MessageSquare, TrendingUp, ArrowRight, LayoutDashboard } from "lucide-react";

// 🔥 NEW IMPORT: Get the Task Context
import { useTasks } from "../context/TaskContext"; 

export default function Dashboard() {
  const navigate = useNavigate();

  const [pomodoroStats, setPomodoroStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    weekSessions: 0
  });
  const [loading, setLoading] = useState(true);

  // 🔥 NEW: Consume Task Context
  const { tasks, loading: tasksLoading } = useTasks();

  // DERIVED STATE: Filter tasks locally using the context's full task list
  const todayTasks = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    const today = new Date().toDateString();
    return new Date(task.dueDate).toDateString() === today;
  });

  // ============================================
  // FETCH DASHBOARD DATA (Only Pomodoro Stats)
  // ============================================
  
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const statsRes = await fetch("http://localhost:5000/api/pomodoro/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setPomodoroStats(statsData);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ============================================
  // HANDLE POMODORO SESSION COMPLETION
  // ============================================
  
  async function handleSessionComplete(sessionData) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/pomodoro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(sessionData)
      });

      if (res.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error("❌ Error saving session:", error);
    }
  }

  // ============================================
  // QUICK LINKS CONFIGURATION
  // ============================================
  
  const quickLinks = [
    {
      title: "Manage Tasks",
      description: "Create and track your study tasks",
      icon: CheckSquare,
      path: "/tasks",
      color: "bg-blue-500",
      darkRing: "dark:ring-blue-500/20"
    },
    {
      title: "Study Materials",
      description: "Upload and organize your notes",
      icon: BookOpen,
      path: "/materials",
      color: "bg-green-500",
      darkRing: "dark:ring-emerald-500/20"
    },
    {
      title: "Community Forum",
      description: "Connect with other students",
      icon: MessageSquare,
      path: "/forum",
      color: "bg-purple-500",
      darkRing: "dark:ring-purple-500/20"
    },
    {
      title: "View Analytics",
      description: "Track your productivity stats",
      icon: TrendingUp,
      path: "/analytics",
      color: "bg-orange-500",
      darkRing: "dark:ring-orange-500/20"
    }
  ];

  const dashboardLoading = loading || tasksLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with improved dark visibility */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg">
          <LayoutDashboard size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Overview of your progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Welcome Card - Brighter Dark Mode */}
          <div className="rounded-2xl p-6 bg-white dark:bg-[#1E293B] shadow-md border border-transparent dark:border-slate-700/50">
            <h2 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-white">Welcome back! 👋</h2>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Ready to focus and be productive today?
            </p>
          </div>

          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] shadow-md hover:shadow-lg border border-transparent dark:border-slate-700/50 transition-all hover:scale-[1.02] text-left group"
                >
                  <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  <h3 className="font-semibold mb-1 flex items-center justify-between text-slate-900 dark:text-white">
                    {link.title}
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    {link.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Today's Tasks Preview - Enhanced contrast */}
          <div className="rounded-2xl p-6 bg-white dark:bg-[#1E293B] shadow-md border border-transparent dark:border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-900 dark:text-white">Today's Tasks</h3>
              <button
                onClick={() => navigate("/tasks")}
                className="text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                View all →
              </button>
            </div>
            
            {dashboardLoading ? (
              <div className="text-sm text-gray-500 animate-pulse">Loading...</div>
            ) : todayTasks.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-slate-400 py-4 italic text-center">
                No tasks due today.
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 3).map(task => (
                  <div
                    key={task._id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer border border-transparent dark:border-slate-700/30"
                    onClick={() => navigate("/tasks")}
                  >
                    <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className={`text-sm flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {task.title}
                    </span>
                    {task.pomodoroSessions > 0 && (
                      <span className="text-xs text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border dark:border-slate-700">
                        🍅 {task.pomodoroSessions}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-2xl p-1 bg-white dark:bg-[#1E293B] shadow-md border border-transparent dark:border-slate-700/50">
            <PomodoroTimer onSessionComplete={handleSessionComplete} />
          </div>
          
          <div className="rounded-2xl p-6 bg-white dark:bg-[#1E293B] shadow-md border border-transparent dark:border-slate-700/50">
            <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">Quick Stats</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-slate-400">Tasks Today</span>
                <span className="font-bold text-slate-900 dark:text-white">{todayTasks.length}</span> 
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-slate-400">Focus Time</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {dashboardLoading ? '...' : `${Math.floor(pomodoroStats.totalMinutes / 60)}h ${pomodoroStats.totalMinutes % 60}m`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-slate-400">This Week</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {dashboardLoading ? '...' : `🍅 ${pomodoroStats.weekSessions}`}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30">
            <h4 className="font-bold mb-2 text-sm text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <span>💡</span> Pro Tip
            </h4>
            <p className="text-xs text-indigo-800/80 dark:text-slate-400 leading-relaxed">
              Link your Pomodoro sessions to specific tasks to track time spent and stay organized!
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}