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
    
    const [mode, setMode] = useState('focus'); // 'focus' or 'break'
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [timeLeft, setTimeLeft] = useState(focusTime * 60);
    const [isRunning, setIsRunning] = useState(false);
    
    // Timer Refs
    const intervalRef = useRef(null);
    // Guard against double execution when timer hits zero
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

    const handleTimerComplete = useCallback(() => {
        // 🎯 FIX: Guard against running the completion logic twice
        if (isHandlingCompletion.current) return;
        isHandlingCompletion.current = true;
        
        setIsRunning(false);
        
        if (mode === 'focus') {
            setSessionsCompleted(prev => prev + 1);
            
            // Execute the external callback (e.g., logging to API)
            if (onSessionComplete) {
                onSessionComplete({
                    duration: focusTime * 60,
                    type: 'focus',
                    completedAt: new Date(),
                    taskId: selectedTask 
                });
            }
            
            setMode('break');
            setTimeLeft(breakTime * 60);
        } else {
            setMode('focus');
            setTimeLeft(focusTime * 60);
        }

        // Release the guard after state updates have settled
        setTimeout(() => { isHandlingCompletion.current = false; }, 50); 
    }, [mode, focusTime, breakTime, onSessionComplete, selectedTask]);

    // 🎯 PERSISTENT TIMER EFFECT (The engine that runs always)
    useEffect(() => {
        if (!isRunning) {
            clearInterval(intervalRef.current);
            return;
        }

        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    handleTimerComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [isRunning, handleTimerComplete]); 

    // --- Control Functions ---
    const toggleTimer = () => setIsRunning(prev => !prev);

    const resetTimer = () => {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        setTimeLeft(mode === 'focus' ? focusTime * 60 : breakTime * 60);
    };

    const switchMode = () => {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        
        const newMode = mode === 'focus' ? 'break' : 'focus';
        setMode(newMode);
        setTimeLeft(newMode === 'focus' ? focusTime * 60 : breakTime * 60);
    };
    
    const applySettings = (newFocus, newBreak) => {
        setFocusTime(newFocus);
        setBreakTime(newBreak);
        localStorage.setItem("pomodoroFocusTime", newFocus);
        localStorage.setItem("pomodoroBreakTime", newBreak);
        
        // Reset timer with new times
        clearInterval(intervalRef.current);
        setIsRunning(false);
        setTimeLeft(mode === 'focus' ? newFocus * 60 : newBreak * 60);
    };

    // ============================================
    // IV. TASK MANAGEMENT LOGIC
    // ============================================

    const fetchTasks = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/tasks", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                // Store only incomplete tasks
                setTasks(data.tasks.filter(t => !t.completed));
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    }, []);

    // Fetch tasks on initial mount
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Function to handle task completion from *anywhere* in the app (TaskList component)
    const completeTask = useCallback(async (taskId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/complete`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                // Optimistically remove the task from the central state
                setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
                
                // If the currently selected task was just completed, deselect it
                if (selectedTask === taskId) {
                    setSelectedTask(null);
                }
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
                // Timer
                timeLeft, isRunning, mode, sessionsCompleted, focusTime, breakTime,
                formatTime, toggleTimer, resetTimer, switchMode, applySettings,
                // Tasks
                tasks, selectedTask, setSelectedTask, fetchTasks, completeTask,
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
}