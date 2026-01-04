// src/App.jsx - FINAL CORRECTED VERSION

import React from 'react';
import { Routes, Route, Navigate ,useLocation} from 'react-router-dom';
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
import { useAuth } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import { MaterialsProvider } from './context/MaterialsContext'; 
import { AnalyticsProvider } from './context/AnalyticsContext';
import { ForumProvider } from './context/ForumContext';
import { TaskProvider } from './context/TaskContext';
import axios from 'axios'; 

// Set axios to send cookies with all requests
axios.defaults.withCredentials = true;

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null; // Wait for session check
  if (user) return <Navigate to="/dashboard" replace />;
  
  return children;
};

export default function App() {
 
 // Handler for when pomodoro session completes
 async function handleSessionComplete(sessionData) {
  console.log("🍅 Pomodoro session completed:", sessionData);
  
  try {
   // FIX: Use axios to automatically send the secure cookie
   const res = await axios.post("http://localhost:5000/api/pomodoro", sessionData);

   if (res.status === 200) {
    console.log("✅ Session saved to database");
   } else {
    console.error("❌ Failed to save session");
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
    <Navbar />
    <main className="p-6 max-w-7xl mx-auto">
     <Routes>
      {/* 1. Public Routes */}
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

            {/* 🔥 CRITICAL FIX: The root path "/" redirects the user. 
               ProtectedRoute handles the actual login check. */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 2. Protected Dashboard Route */}
      <Route
       path="/dashboard" 
       element={
        <ProtectedRoute>
         <TaskProvider>
         <DashboardProvider onSessionComplete={handleSessionComplete}>
          <Dashboard />
         </DashboardProvider>
         </TaskProvider>
        </ProtectedRoute>
       }
      />
            
      <Route
       path="/tasks"
       element={
        <ProtectedRoute>
         <TaskProvider>
         <Tasks />
         </TaskProvider>
        </ProtectedRoute>
       }
      />
      <Route
       path="/materials"
       element={
        <ProtectedRoute>
         <MaterialsProvider>
          <Materials />
         </MaterialsProvider>
        </ProtectedRoute>
       }
      />
      <Route
       path="/forum"
       element={
        <ProtectedRoute>
         <ForumProvider>
          <Forum />
         </ForumProvider>
        </ProtectedRoute>
       }
      />
      <Route
       path="/analytics"
       element={
        <ProtectedRoute>
         <AnalyticsProvider>
          <Analytics />
         </AnalyticsProvider>
        </ProtectedRoute>
       }
      />
     </Routes>
    </main>
   </div>
  </ThemeProvider>
 );
}