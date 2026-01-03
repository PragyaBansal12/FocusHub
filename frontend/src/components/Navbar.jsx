import React from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../context/AuthContext";
import { Moon, Sun,LogOut,LayoutDashboard,CheckSquare,BookOpen,MessageSquare,TrendingUp} from "lucide-react";
import { useNavigate,useLocation } from "react-router-dom";

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const {user,logout} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems=[
    {path:"/" ,label:"Dashboard",icon:LayoutDashboard},
    {path:"/tasks",label:"Tasks",icon:CheckSquare},
    {path:"/materials",label:"Materials",icon:BookOpen},
    {path:"/forum",label:"Forum",icon:MessageSquare},
    {path:"/analytics",label:"Analytics",icon:TrendingUp},
  ]
  return (
    <header className="bg-white dark:bg-[#0b0d12] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div 
              className="text-xl font-semibold text-accent cursor-pointer"
              onClick={() => navigate(user ? "/" : "/home")}
            >
              FocusHub+
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              Study. Focus. Thrive.
            </div>
          </div>

          {/* Navigation Menu (only when logged in) */}
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
                        ? "bg-accent text-white"
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

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-md bg-gray-100 dark:bg-[#111318] hover:scale-105 transition-transform"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Logout Button (only when logged in) */}
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <LogOut size={16} />
                <span className="text-sm font-medium hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation (when logged in) */}
        {user && (
          <nav className="md:hidden flex gap-1 mt-3 overflow-x-auto pb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-accent text-white"
                      : "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#111318]"
                  }`}
                >
                  <Icon size={14} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}