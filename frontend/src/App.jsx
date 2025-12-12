import React from 'react'
import {Routes,Route} from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Navbar from './components/Navbar'
import ThemeProvider from './theme/ThemeProvider'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProtectedRoute from './components/ProtectedRoute'
import Tasks from './pages/Tasks'
import Materials from './pages/Materials'
import Forum from './pages/Forum'
import Analytics from './pages/Analytics'
import {DashboardProvider} from './context/DashboardContext'

export default function App() {
  const logSession = ({duration,type,completedAt,taskId}) => {
    console.log("Session completed and logged to API:",{duration,type,completedAt,taskId});
  }
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] text-gray-900 dark:text-gray-100 transition-theme">
        <DashboardProvider onSessionComplete={logSession}>
        <Navbar />
        <main className="p-6 max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks/></ProtectedRoute>}/>
            <Route path="/forum" element={<ProtectedRoute><Forum/></ProtectedRoute>}/>
            <Route path="/materials" element={<ProtectedRoute><Materials/></ProtectedRoute>}/>
            <Route path="/analytics" element={<ProtectedRoute><Analytics/></ProtectedRoute>}/>
          </Routes>
        </main>
        </DashboardProvider>
      </div>
    </ThemeProvider>
  );
}