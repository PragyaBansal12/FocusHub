import React from 'react';
import { Clock, Target, TrendingUp, Flame, BookOpen, CheckCircle } from 'lucide-react';
import { useAnalytics } from '../context/AnalyticsContext';
import StatCard from '../components/StatCard';
import FocusTimeChart from '../components/charts/FocusTimeChart';
import TaskCompletionChart from '../components/charts/TaskCompletionChart';
import TaskPriorityChart from '../components/charts/TaskPriorityChart';
import WeeklyPomodoroChart from '../components/charts/WeeklyPomodoroChart';
import ProductivityHoursChart from '../components/charts/ProductivityHoursChart';

export default function Analytics() {
  const { analytics, loading } = useAnalytics();

  // ============================================
  // LOADING STATE
  // ============================================
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Analytics Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track your productivity and study patterns
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Focus Time */}
        <StatCard
          icon={Clock}
          title="Total Focus Time"
          value={formatTime(analytics.totalFocusTime)}
          subtitle="All time"
          color="bg-blue-500"
        />

        {/* Total Sessions */}
        <StatCard
          icon={Target}
          title="Pomodoro Sessions"
          value={analytics.pomodoroStats.totalSessions}
          subtitle={`${analytics.pomodoroStats.weekSessions} this week`}
          color="bg-purple-500"
        />

        {/* Current Streak */}
        <StatCard
          icon={Flame}
          title="Current Streak"
          value={`${analytics.streakData.currentStreak} days`}
          subtitle={`Best: ${analytics.streakData.longestStreak} days`}
          color="bg-orange-500"
        />

        {/* Task Completion */}
        <StatCard
          icon={CheckCircle}
          title="Task Completion"
          value={`${analytics.taskStats.completionRate}%`}
          subtitle={`${analytics.taskStats.completed}/${analytics.taskStats.total} completed`}
          color="bg-green-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="space-y-6">
        {/* Focus Time Trend - Full Width */}
        <FocusTimeChart data={analytics.focusTimeData} />

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Pomodoro Sessions */}
          <WeeklyPomodoroChart data={analytics.weeklyPomodoroData} />

          {/* Task Completion */}
          <TaskCompletionChart stats={analytics.taskStats} />
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks by Priority */}
          <TaskPriorityChart tasksByPriority={analytics.tasksByPriority} />

          {/* Productivity Hours */}
          <ProductivityHoursChart 
            data={analytics.productivityByHour}
            mostProductiveHour={analytics.mostProductiveHour}
          />
        </div>

        {/* Study Materials Overview */}
        {analytics.materialsStats.totalFiles > 0 && (
          <div className="bg-white dark:bg-[#121318] rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen size={20} />
              Study Materials Overview
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-1">
                  {analytics.materialsStats.totalFiles}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Files</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-1">
                  {analytics.materialsStats.totalSizeMB} MB
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Storage Used</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">
                  {analytics.materialsStats.byType?.pdf || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">PDFs</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500 mb-1">
                  {analytics.materialsStats.byType?.image || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Images</div>
              </div>
            </div>

            {/* Top Tags */}
            {analytics.materialsStats.tags && analytics.materialsStats.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm font-medium mb-2">Most Used Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {analytics.materialsStats.tags.slice(0, 10).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Insights & Recommendations */}
        <div className="bg-gradient-to-br from-accent/10 to-purple-500/10 rounded-xl p-6 border border-accent/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Insights & Tips
          </h3>
          
          <div className="space-y-3">
            {/* Streak Insight */}
            {analytics.streakData.currentStreak > 0 && (
              <div className="flex items-start gap-3">
                <Flame className="text-orange-500 flex-shrink-0 mt-1" size={18} />
                <div>
                  <p className="font-medium">Great streak!</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You've been consistent for {analytics.streakData.currentStreak} days. 
                    Keep it up to reach your best of {analytics.streakData.longestStreak} days!
                  </p>
                </div>
              </div>
            )}

            {/* Productivity Hour Insight */}
            {analytics.mostProductiveHour && (
              <div className="flex items-start gap-3">
                <Clock className="text-blue-500 flex-shrink-0 mt-1" size={18} />
                <div>
                  <p className="font-medium">Peak productivity at {analytics.mostProductiveHour}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Schedule your most important tasks during this time for maximum focus.
                  </p>
                </div>
              </div>
            )}

            {/* Task Completion Insight */}
            {analytics.taskStats.completionRate < 50 && analytics.taskStats.total > 0 && (
              <div className="flex items-start gap-3">
                <Target className="text-purple-500 flex-shrink-0 mt-1" size={18} />
                <div>
                  <p className="font-medium">Boost your completion rate</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You have {analytics.taskStats.pending} pending tasks. 
                    Try breaking them into smaller, manageable subtasks.
                  </p>
                </div>
              </div>
            )}

            {/* High Priority Tasks Insight */}
            {analytics.tasksByPriority.high > 5 && (
              <div className="flex items-start gap-3">
                <CheckCircle className="text-red-500 flex-shrink-0 mt-1" size={18} />
                <div>
                  <p className="font-medium">Many high-priority tasks</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You have {analytics.tasksByPriority.high} high-priority tasks. 
                    Consider if all of them truly need urgent attention.
                  </p>
                </div>
              </div>
            )}

            {/* No Data Yet */}
            {analytics.pomodoroStats.totalSessions === 0 && analytics.taskStats.total === 0 && (
              <div className="flex items-start gap-3">
                <TrendingUp className="text-accent flex-shrink-0 mt-1" size={18} />
                <div>
                  <p className="font-medium">Start building your productivity data!</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create tasks and complete Pomodoro sessions to see personalized insights here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}