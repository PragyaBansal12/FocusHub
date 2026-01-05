import React, { useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../context/AuthContext";
import { 
  Moon, 
  Sun, 
  LogOut, 
  LayoutDashboard, 
  CheckSquare, 
  BookOpen, 
  MessageSquare, 
  TrendingUp 
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import ProfileModal from "./ProfileModal";

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // 🔥 SAFETY CHECK: Do not render Navbar on Login or Signup pages
  const authPaths = ["/login", "/signup"];
  if (authPaths.includes(location.pathname)) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // 🔥 PATHS UPDATED: Ensured dashboard is explicitly /dashboard
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/tasks", label: "Tasks", icon: CheckSquare },
    { path: "/materials", label: "Materials", icon: BookOpen },
    { path: "/forum", label: "Forum", icon: MessageSquare },
    { path: "/analytics", label: "Analytics", icon: TrendingUp },
  ];

  return (
    <header className="bg-white dark:bg-[#0b0d12] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div 
              className="text-xl font-semibold text-accent cursor-pointer"
              onClick={() => navigate(user ? "/dashboard" : "/home")}
            >
              FocusHub+
            </div>
          </div>

          {/* Navigation Links - Only visible if user is logged in */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-accent text-white shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#111318]"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-md bg-gray-100 dark:bg-[#111318] hover:scale-105 transition-transform"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user && (
              <div className="flex items-center gap-3 border-l dark:border-gray-800 pl-3">
                
                {/* Profile Section */}
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-all group"
                >
                  <img 
                    src={user?.profilePicture} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover border border-accent/30 shadow-sm"
                  />
                  <span className="hidden sm:block text-sm font-bold dark:text-white group-hover:text-accent transition-colors">
                    {user?.name}
                  </span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </header>
  );
}