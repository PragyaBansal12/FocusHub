import React from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Materials from './pages/Materials';
import Chat from './pages/Chat';
import Analytics from './pages/Analytics';
import Navbar from './components/Navbar';
import ThemeProvider from './theme/ThemeProvider';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Subscription from './pages/Subscription';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingTimer from './components/FloatingTimer';
import { useAuth } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import { MaterialsProvider } from './context/MaterialsContext'; 
import { AnalyticsProvider } from './context/AnalyticsContext';
import { ChatProvider } from './context/ChatContext';
import { TaskProvider } from './context/TaskContext';
import { usePushNotifications } from './hooks/usePushNotifications';
import axios from 'axios'; 

// Set axios to send cookies with all requests
axios.defaults.withCredentials = true;

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null; 
  if (user) return <Navigate to="/dashboard" replace />;
  
  return children;
};


const ProtectedLayout = ({ handleSessionComplete }) => {
  usePushNotifications();
  return (
    <ProtectedRoute>
      <TaskProvider>
        <AnalyticsProvider>
          <DashboardProvider onSessionComplete={handleSessionComplete}>
            <Outlet />
            <FloatingTimer />
          </DashboardProvider>
        </AnalyticsProvider>
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
    console.log("Pomodoro session completed:", sessionData);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/pomodoro`, sessionData);
      if (res.status === 200) {
        console.log(" Session saved to database");
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

            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route element={<ProtectedLayout handleSessionComplete={handleSessionComplete} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/materials" element={
                <MaterialsProvider>
                  <Materials />
                </MaterialsProvider>
              } />
              <Route path="/chat" element={
                <ChatProvider>
                  <Chat />
                </ChatProvider>
              } />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/subscription" element={<Subscription />} />
            </Route>
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}