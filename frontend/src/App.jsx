import React from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Materials from './pages/Materials';
import Forum from './pages/Forum';
import Analytics from './pages/Analytics';
import Navbar from './components/Navbar';
import ThemeProvider from './theme/ThemeProvider';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingTimer from './components/FloatingTimer';
import { useAuth } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import { MaterialsProvider } from './context/MaterialsContext'; 
import { AnalyticsProvider } from './context/AnalyticsContext';
import { ForumProvider } from './context/ForumContext';
import { TaskProvider } from './context/TaskContext';
import { usePushNotifications } from './hooks/usePushNotifications';
import axios from 'axios'; 

// Set axios to send cookies with all requests
axios.defaults.withCredentials = true;

/**
 * 🔥 RESTRICTED ROUTE: Redirects logged-in users away from Auth pages.
 */
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null; 
  if (user) return <Navigate to="/dashboard" replace />;
  
  return children;
};

/**
 * 🔥 PROTECTED LAYOUT: Wraps all protected routes in the global providers.
 * This ensures the Timer and Tasks states survive route changes!
 */
const ProtectedLayout = ({ handleSessionComplete }) => {
  usePushNotifications();
  return (
    <ProtectedRoute>
      <TaskProvider>
        <DashboardProvider onSessionComplete={handleSessionComplete}>
          <Outlet />
          <FloatingTimer />
        </DashboardProvider>
      </TaskProvider>
    </ProtectedRoute>
  );
};

export default function App() {
  const location = useLocation();

  // Hide the Navbar if the current path is Login or Signup
  const authPaths = ['/login', '/signup'];
  const showNavbar = !authPaths.includes(location.pathname);

  // Handler for when pomodoro session completes
  async function handleSessionComplete(sessionData) {
    console.log("🍅 Pomodoro session completed:", sessionData);
    try {
      const res = await axios.post("http://localhost:5000/api/pomodoro", sessionData);
      if (res.status === 200) {
        console.log("✅ Session saved to database");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error("❌ Session expired while saving pomodoro.");
      }
      console.error("Error saving session:", error);
    }
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] text-gray-900 dark:text-gray-100 transition-theme">
        
        {showNavbar && <Navbar />}
        
        <main className={`${showNavbar ? 'p-6' : 'p-0'} max-w-7xl mx-auto`}>
          <Routes>
            {/* 1. Public Routes */}
            <Route path="/home" element={<Home />} />
            
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            {/* Root path redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 2. Protected Routes (Wrapped in Providers so timer never dies) */}
            <Route element={<ProtectedLayout handleSessionComplete={handleSessionComplete} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/materials" element={
                <MaterialsProvider>
                  <Materials />
                </MaterialsProvider>
              } />
              <Route path="/forum" element={
                <ForumProvider>
                  <Forum />
                </ForumProvider>
              } />
              <Route path="/analytics" element={
                <AnalyticsProvider>
                  <Analytics />
                </AnalyticsProvider>
              } />
            </Route>
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}