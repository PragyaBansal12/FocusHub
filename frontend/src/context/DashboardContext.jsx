import React, { createContext, useState, useEffect, useRef, useContext, useCallback } from 'react';

// 1. Context Creation
const DashboardContext = createContext(null);

// 2. Custom Hook for easy access
export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};

// Helper function to safely get time from localStorage
const getStoredTime = (key, defaultValue) => 
    parseInt(localStorage.getItem(key) || defaultValue);

// 3. Provider Component
export function DashboardProvider({ children, onSessionComplete }) {
    // ============================================
    // I. TIMER STATE & SETTINGS (PERSISTENT)
    // ============================================
    const [focusTime, setFocusTime] = useState(getStoredTime("pomodoroFocusTime", 25));
    const [breakTime, setBreakTime] = useState(getStoredTime("pomodoroBreakTime", 5));
    
    const [mode, setMode] = useState(localStorage.getItem("pomodoroMode") || 'focus'); 
    const [sessionsCompleted, setSessionsCompleted] = useState(0);

    // Initialize state from localStorage to survive reloads/tab switches
    const storedEndTime = localStorage.getItem("pomodoroTargetEndTime");
    const storedTimeLeft = localStorage.getItem("pomodoroTimeLeft");
    
    const initialTimeLeft = storedEndTime 
        ? Math.max(0, Math.ceil((parseInt(storedEndTime) - Date.now()) / 1000))
        : (storedTimeLeft ? parseInt(storedTimeLeft) : focusTime * 60);

    const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
    const [isRunning, setIsRunning] = useState(!!storedEndTime && initialTimeLeft > 0);
    
    const targetEndTimeRef = useRef(storedEndTime ? parseInt(storedEndTime) : null);
    const intervalRef = useRef(null);
    const isHandlingCompletion = useRef(false); 

    // ============================================
    // II. TASK STATE (CENTRALIZED)
    // ============================================
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    
    // ============================================
    // III. TIMER CONTROL LOGIC
    // ============================================
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const playNotificationSound = () => {
        try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play().catch(e => console.log("Audio play blocked by browser:", e));
        } catch (error) {
            console.log("Could not play sound:", error);
        }
    };

    const showBrowserNotification = (title, body) => {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body });
        }
    };

    const handleTimerComplete = useCallback(() => {
        if (isHandlingCompletion.current) return;
        isHandlingCompletion.current = true;
        
        setIsRunning(false);
        targetEndTimeRef.current = null;
        localStorage.removeItem("pomodoroTargetEndTime");
        
        if (mode === 'focus') {
            setSessionsCompleted(prev => prev + 1);
            
            if (onSessionComplete) {
                onSessionComplete({
                    duration: focusTime * 60,
                    type: 'focus',
                    completedAt: new Date(),
                    taskId: selectedTask 
                });
            }
            
            setMode('break');
            localStorage.setItem("pomodoroMode", 'break');
            const newTime = breakTime * 60;
            setTimeLeft(newTime);
            localStorage.setItem("pomodoroTimeLeft", newTime.toString());
        } else {
            setMode('focus');
            localStorage.setItem("pomodoroMode", 'focus');
            const newTime = focusTime * 60;
            setTimeLeft(newTime);
            localStorage.setItem("pomodoroTimeLeft", newTime.toString());
        }

        setTimeout(() => { isHandlingCompletion.current = false; }, 50); 
    }, [mode, focusTime, breakTime, onSessionComplete, selectedTask]);

    // 🎯 ABSOLUTE TIME ENGINE (Immune to browser throttling)
    useEffect(() => {
        if (!isRunning) {
            clearInterval(intervalRef.current);
            return;
        }

        // If target doesn't exist but we are running, create it
        if (!targetEndTimeRef.current) {
            const target = Date.now() + (timeLeft * 1000);
            targetEndTimeRef.current = target;
            localStorage.setItem("pomodoroTargetEndTime", target.toString());
        }

        intervalRef.current = setInterval(() => {
            if (!targetEndTimeRef.current) return;

            const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
            
            if (remaining <= 0) {
                clearInterval(intervalRef.current);
                setTimeLeft(0);
                localStorage.setItem("pomodoroTimeLeft", "0");
                handleTimerComplete();
            } else {
                setTimeLeft(remaining);
                localStorage.setItem("pomodoroTimeLeft", remaining.toString());
            }
        }, 500); // 500ms for smoother updates even if throttled

        return () => clearInterval(intervalRef.current);
    }, [isRunning, handleTimerComplete]); 

    // --- Control Functions ---
    const toggleTimer = () => {
        if (isRunning) {
            // Pause
            setIsRunning(false);
            targetEndTimeRef.current = null;
            localStorage.removeItem("pomodoroTargetEndTime");
            localStorage.setItem("pomodoroTimeLeft", timeLeft.toString());
        } else {
            // Start
            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission();
            }
            
            setIsRunning(true);
            const target = Date.now() + (timeLeft * 1000);
            targetEndTimeRef.current = target;
            localStorage.setItem("pomodoroTargetEndTime", target.toString());
        }
    };

    const resetTimer = () => {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        targetEndTimeRef.current = null;
        localStorage.removeItem("pomodoroTargetEndTime");
        
        const resetTime = mode === 'focus' ? focusTime * 60 : breakTime * 60;
        setTimeLeft(resetTime);
        localStorage.setItem("pomodoroTimeLeft", resetTime.toString());
    };

    const switchMode = () => {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        targetEndTimeRef.current = null;
        localStorage.removeItem("pomodoroTargetEndTime");
        
        const newMode = mode === 'focus' ? 'break' : 'focus';
        setMode(newMode);
        localStorage.setItem("pomodoroMode", newMode);
        
        const newTime = newMode === 'focus' ? focusTime * 60 : breakTime * 60;
        setTimeLeft(newTime);
        localStorage.setItem("pomodoroTimeLeft", newTime.toString());
    };
    
    const applySettings = (newFocus, newBreak) => {
        setFocusTime(newFocus);
        setBreakTime(newBreak);
        localStorage.setItem("pomodoroFocusTime", newFocus.toString());
        localStorage.setItem("pomodoroBreakTime", newBreak.toString());
        
        clearInterval(intervalRef.current);
        setIsRunning(false);
        targetEndTimeRef.current = null;
        localStorage.removeItem("pomodoroTargetEndTime");
        
        const newTime = mode === 'focus' ? newFocus * 60 : newBreak * 60;
        setTimeLeft(newTime);
        localStorage.setItem("pomodoroTimeLeft", newTime.toString());
    };

    // ============================================
    // IV. TASK MANAGEMENT LOGIC
    // ============================================

    const fetchTasks = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks.filter(t => !t.completed));
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const completeTask = useCallback(async (taskId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks/${taskId}/complete`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
                if (selectedTask === taskId) setSelectedTask(null);
            } else {
                 console.error("Failed to complete task on server.");
            }
        } catch (error) {
            console.error("Error completing task:", error);
        }
    }, [selectedTask]);

    return (
        <DashboardContext.Provider 
            value={{
                timeLeft, isRunning, mode, sessionsCompleted, focusTime, breakTime,
                formatTime, toggleTimer, resetTimer, switchMode, applySettings,
                tasks, selectedTask, setSelectedTask, fetchTasks, completeTask,
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
}