import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Settings, X } from "lucide-react";
import { useDashboard } from '../context/DashboardContext'; 

// 🎯 NOTE: The onSessionComplete prop is removed as this logic is handled centrally in the DashboardProvider.
export default function PomodoroTimer() { 
    
    // ============================================
    // CONTEXT CONSUMPTION (REPLACES ALL GLOBAL STATE)
    // ============================================
    const { 
        // Timer State & Settings
        timeLeft, isRunning, mode, sessionsCompleted, focusTime, breakTime,
        // Timer Controls
        toggleTimer, resetTimer, switchMode, applySettings, formatTime, 
        // Task State & Controls
        tasks, selectedTask, setSelectedTask
    } = useDashboard();
    
    // ============================================
    // LOCAL STATE (Only for the settings modal UI)
    // ============================================
    
    const [showSettings, setShowSettings] = useState(false);
    // Temporary values are synced to context values
    const [tempFocusTime, setTempFocusTime] = useState(focusTime); 
    const [tempBreakTime, setTempBreakTime] = useState(breakTime);
    const audioRef = useRef(null);

    // ============================================
    // EFFECTS
    // ============================================
    
    // 1. Sync temporary settings when context focus/break times change 
    // (Important if settings are changed outside this modal or when the component mounts)
    useEffect(() => {
        setTempFocusTime(focusTime);
        setTempBreakTime(breakTime);
    }, [focusTime, breakTime]);

    // 2. Sound effect logic: Triggered when the central timer state hits 0 and stops
    useEffect(() => {
        // If the time is 0 and the timer is no longer running, a session has completed.
        if (timeLeft === 0 && !isRunning) {
            playNotificationSound();
        }
    }, [timeLeft, isRunning]);


    // ============================================
    // SETTINGS MANAGEMENT
    // ============================================
    
    function saveSettings() {
        // Ensure inputs are within valid range (1 to 60 for focus, 1 to 30 for break)
        const validFocusTime = Math.max(1, Math.min(60, tempFocusTime));
        const validBreakTime = Math.max(1, Math.min(30, tempBreakTime));
        
        // 🎯 Use the context function to save, apply, and reset the timer
        applySettings(validFocusTime, validBreakTime); 
        
        setShowSettings(false);
    }

    function cancelSettings() {
        // Reset temp state back to current context state
        setTempFocusTime(focusTime); 
        setTempBreakTime(breakTime);
        setShowSettings(false);
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    function playNotificationSound() {
        try {
            if (audioRef.current) {
                // Rewind the sound before playing to ensure it plays every time
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
        } catch (error) {
            console.log("Could not play sound:", error);
        }
    }

    // This helper is kept as it calculates the progress based on context values
    function getProgress() {
        const totalTime = mode === 'focus' ? focusTime * 60 : breakTime * 60;
        // Avoid division by zero if focusTime or breakTime are somehow 0
        return totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
    }

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="bg-white dark:bg-[#121318] rounded-2xl p-6 shadow-md relative">
            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
                preload="auto"
            />

            {/* Header with Settings Button */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Focus Timer</h3>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        🍅 {sessionsCompleted} sessions
                    </span>
                    <button
                        onClick={() => {
                            setTempFocusTime(focusTime);
                            setTempBreakTime(breakTime);
                            setShowSettings(true);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0b0f15] transition"
                        title="Timer Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* ✅ Task Selector - Link Timer to Task (using Context state) */}
            {tasks.length > 0 && (
                <div className="mb-4">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Working on (optional):
                    </label>
                    <select
                        value={selectedTask || ""}
                        onChange={(e) => setSelectedTask(e.target.value || null)} // 🎯 Use context setter
                        className="w-full p-2 text-sm rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent"
                        disabled={isRunning}
                    >
                        <option value="">No specific task</option>
                        {tasks.map(task => ( // 🎯 Use context tasks
                            <option key={task._id} value={task._id}>
                                {task.title}
                            </option>
                        ))}
                    </select>
                    {selectedTask && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ✅ This session will be linked to your task
                        </p>
                    )}
                </div>
            )}

            {/* Mode Indicator */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={switchMode} // 🎯 Use context function
                    disabled={isRunning}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                        mode === 'focus'
                            ? 'bg-accent text-white'
                            : 'bg-gray-100 dark:bg-[#0b0f15] text-gray-600 dark:text-gray-400'
                    } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                >
                    Focus ({focusTime}:00)
                </button>
                <button
                    onClick={switchMode} // 🎯 Use context function
                    disabled={isRunning}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                        mode === 'break'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-[#0b0f15] text-gray-600 dark:text-gray-400'
                    } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                >
                    Break ({breakTime}:00)
                </button>
            </div>

            {/* Circular Timer Display */}
            <div className="relative flex items-center justify-center mb-6">
                <svg className="w-48 h-48 -rotate-90">
                    <circle
                        cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="none"
                        className="text-gray-200 dark:text-gray-800"
                    />
                    <circle
                        cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="none"
                        strokeDasharray={`${2 * Math.PI * 88}`}
                        strokeDashoffset={`${2 * Math.PI * 88 * (1 - getProgress() / 100)}`}
                        className={`${
                            mode === 'focus' ? 'text-accent' : 'text-green-500'
                        } transition-all duration-1000 ease-linear`}
                        strokeLinecap="round"
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{formatTime(timeLeft)}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {mode === 'focus' ? 'Stay Focused' : 'Take a Break'}
                    </span>
                </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={toggleTimer} // 🎯 Use context function
                    className={`flex-1 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                        mode === 'focus'
                            ? 'bg-accent text-white hover:opacity-90'
                            : 'bg-green-500 text-white hover:opacity-90'
                    }`}
                >
                    {isRunning ? (
                        <>
                            <Pause size={18} /> Pause
                        </>
                    ) : (
                        <>
                            <Play size={18} /> Start
                        </>
                    )}
                </button>

                <button
                    onClick={resetTimer} // 🎯 Use context function
                    className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#0b0f15] transition"
                    title="Reset timer"
                >
                    <RotateCcw size={18} />
                </button>
            </div>

            {/* Progress Text */}
            <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {timeLeft === (mode === 'focus' ? focusTime * 60 : breakTime * 60)
                        ? 'Ready to start?'
                        : isRunning
                        ? 'Timer running...'
                        : 'Timer paused'}
                </p>
            </div>

            {/* ============================================ */}
            {/* SETTINGS MODAL */}
            {/* ============================================ */}
            
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#121318] rounded-2xl p-6 max-w-md w-full shadow-xl">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold">Timer Settings</h3>
                            <button
                                onClick={cancelSettings}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0b0f15] transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Settings Form */}
                        <div className="space-y-6">
                            {/* Focus Time Setting */}
                            <div>
                                <label className="block text-sm font-medium mb-3">
                                    Focus Duration
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="60"
                                        value={tempFocusTime}
                                        onChange={(e) => setTempFocusTime(parseInt(e.target.value))}
                                        className="flex-1 accent-accent"
                                    />
                                    <div className="flex items-center gap-2 min-w-[100px]">
                                        <input
                                            type="number"
                                            min="1"
                                            max="60"
                                            value={tempFocusTime}
                                            onChange={(e) => setTempFocusTime(parseInt(e.target.value) || 1)}
                                            className="w-16 p-2 text-center rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none"
                                        />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">min</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Recommended: 25 minutes for optimal focus
                                </p>
                            </div>

                            {/* Break Time Setting */}
                            <div>
                                <label className="block text-sm font-medium mb-3">
                                    Break Duration
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        value={tempBreakTime}
                                        onChange={(e) => setTempBreakTime(parseInt(e.target.value))}
                                        className="flex-1 accent-green-500"
                                    />
                                    <div className="flex items-center gap-2 min-w-[100px]">
                                        <input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={tempBreakTime}
                                            onChange={(e) => setTempBreakTime(parseInt(e.target.value) || 1)}
                                            className="w-16 p-2 text-center rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none"
                                        />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">min</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Recommended: 5 minutes for short breaks
                                </p>
                            </div>

                            {/* Quick Presets */}
                            <div>
                                <label className="block text-sm font-medium mb-3">
                                    Quick Presets
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => {
                                            setTempFocusTime(25);
                                            setTempBreakTime(5);
                                        }}
                                        className="py-2 px-3 rounded-lg bg-gray-100 dark:bg-[#0b0f15] hover:bg-gray-200 dark:hover:bg-[#1a1d24] transition text-sm"
                                    >
                                        Classic<br/>
                                        <span className="text-xs text-gray-500">25/5</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTempFocusTime(50);
                                            setTempBreakTime(10);
                                        }}
                                        className="py-2 px-3 rounded-lg bg-gray-100 dark:bg-[#0b0f15] hover:bg-gray-200 dark:hover:bg-[#1a1d24] transition text-sm"
                                    >
                                        Extended<br/>
                                        <span className="text-xs text-gray-500">50/10</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTempFocusTime(15);
                                            setTempBreakTime(3);
                                        }}
                                        className="py-2 px-3 rounded-lg bg-gray-100 dark:bg-[#0b0f15] hover:bg-gray-200 dark:hover:bg-[#1a1d24] transition text-sm"
                                    >
                                        Quick<br/>
                                        <span className="text-xs text-gray-500">15/3</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={saveSettings}
                                className="flex-1 py-3 bg-accent text-white rounded-lg hover:opacity-90 font-medium transition"
                            >
                                Save Settings
                            </button>
                            <button
                                onClick={cancelSettings}
                                className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0b0f15] transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}