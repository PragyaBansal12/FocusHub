import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useLocation } from 'react-router-dom';
import { Play, Pause, X } from 'lucide-react';

export default function FloatingTimer() {
    const { 
        timeLeft, isRunning, mode, formatTime, toggleTimer 
    } = useDashboard();
    const location = useLocation();

    // Do not show on auth pages or the dashboard (since dashboard has the big timer)
    const hidePaths = ['/login', '/signup', '/dashboard'];
    if (hidePaths.includes(location.pathname)) return null;

    // Optional: Hide if not running and hasn't started
    // But since user wants to track time globally, we'll just show it always on other pages.

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-white dark:bg-[#121318] rounded-full shadow-lg border border-gray-200 dark:border-gray-800 p-2 pr-4 gap-3">
            <button 
                onClick={toggleTimer}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-white transition ${
                    mode === 'focus' ? 'bg-accent' : 'bg-green-500'
                } hover:opacity-90`}
            >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <div className="flex flex-col">
                <span className="text-sm font-bold leading-none">{formatTime(timeLeft)}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{mode}</span>
            </div>
        </div>
    );
}
