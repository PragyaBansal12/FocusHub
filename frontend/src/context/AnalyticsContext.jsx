import React , {createContext,useContext,useState,useEffect,useCallback} from "react"
const AnalyticsContext = createContext(null);

export const useAnalytics = () => {
    const context = useContext(AnalyticsContext);
    if(!context){
        throw new Error('useAnalytics must be used within AnalyticsProvider');
    }
    return context;
};

export function AnalyticsProvider({children}){
    const [loading,setLoading] = useState(true);
    const [analytics,setAnalytics] = useState({
        // Focus Time Data
    focusTimeData: [], // { date, hours, sessions }
    totalFocusTime: 0, // in minutes
    
    // Task Data
    taskStats: {
      total: 0,
      completed: 0,
      pending: 0,
      completionRate: 0
    },
    tasksByPriority: {
      high: 0,
      medium: 0,
      low: 0
    },
    
    // Pomodoro Data
    pomodoroStats: {
      totalSessions: 0,
      weekSessions: 0,
      avgSessionsPerDay: 0
    },
    weeklyPomodoroData: [], // { day, sessions }
    
    // Productivity Hours
    productivityByHour: [], // { hour, sessions }
    mostProductiveHour: null,
    
    // Streak Data
    streakData: {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null
    },
    
    // Materials Data
    materialsStats: {
      totalFiles: 0,
      totalSizeMB: 0,
      byType: {},
      topTags: []
    }
    });

    // ============================================
  // FETCH ANALYTICS DATA
  // ============================================
  
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all analytics data in parallel
      const [
        focusTimeRes,
        tasksRes,
        pomodoroStatsRes,
        pomodoroSessionsRes,
        materialsStatsRes
      ] = await Promise.all([
        fetch('http://localhost:5000/api/analytics/focus-time?days=30', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/analytics/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/pomodoro/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/analytics/pomodoro-sessions?days=7', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/materials/stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [
        focusTimeData,
        tasksData,
        pomodoroStatsData,
        pomodoroSessionsData,
        materialsStatsData
      ] = await Promise.all([
        focusTimeRes.ok ? focusTimeRes.json() : { data: [], totalMinutes: 0 },
        tasksRes.ok ? tasksRes.json() : { taskStats: {}, tasksByPriority: {} },
        pomodoroStatsRes.ok ? pomodoroStatsRes.json() : { totalSessions: 0, weekSessions: 0 },
        pomodoroSessionsRes.ok ? pomodoroSessionsRes.json() : { data: [], productivityByHour: [] },
        materialsStatsRes.ok ? materialsStatsRes.json() : { totalFiles: 0 }
      ]);

      // Process and set analytics data
      setAnalytics({
        focusTimeData: focusTimeData.data || [],
        totalFocusTime: focusTimeData.totalMinutes || 0,
        
        taskStats: tasksData.taskStats || {
          total: 0,
          completed: 0,
          pending: 0,
          completionRate: 0
        },
        tasksByPriority: tasksData.tasksByPriority || {
          high: 0,
          medium: 0,
          low: 0
        },
        
        pomodoroStats: {
          totalSessions: pomodoroStatsData.totalSessions || 0,
          weekSessions: pomodoroStatsData.weekSessions || 0,
          avgSessionsPerDay: pomodoroSessionsData.avgPerDay || 0
        },
        weeklyPomodoroData: pomodoroSessionsData.data || [],
        
        productivityByHour: pomodoroSessionsData.productivityByHour || [],
        mostProductiveHour: pomodoroSessionsData.mostProductiveHour || null,
        
        streakData: pomodoroSessionsData.streakData || {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null
        },
        
        materialsStats: materialsStatsData || {
          totalFiles: 0,
          totalSizeMB: 0,
          byType: {},
          topTags: []
        }
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const value = {
    analytics,
    loading,
    fetchAnalytics
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}