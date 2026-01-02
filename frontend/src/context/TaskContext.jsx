// src/context/TaskContext.js - FINAL CORRECTED CODE READY TO COPY PASTE

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios'; // axios is correctly imported

// 1. Create the Context object
export const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // ============================================
    // TASK API FUNCTIONS (Fetch, CRUD)
    // ============================================

    // 🔴 FIX 1: fetchTasks converted to axios.get
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            // 🔥 REMOVED: const token = localStorage.getItem("token");
            
            // Use axios.get: automatically sends secure cookie
            const res = await axios.get("http://localhost:5000/api/tasks");
            
            // Axios response data is at res.data
            setTasks(res.data.tasks); 
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    
    // 🔴 FIX 2: createTask converted to axios.post
    const createTask = async (formData) => {
        try {
            // 🔥 REMOVED: const token = localStorage.getItem("token");
            
            const taskData = {
                ...formData,
                // Ensure tags array is correctly formatted before sending
                tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean) 
            };
            
            // Use axios.post: automatically sends secure cookie
            const res = await axios.post("http://localhost:5000/api/tasks", taskData);

            // Axios response data is at res.data
            const resultTask = res.data.task; 
            
            // Add the task returned by the server
            setTasks(prev => [...prev, resultTask]); 
            return resultTask; 
        } catch (error) {
            console.error("Error creating task:", error);
            throw error;
        }
    };
    
    
    // ✅ updateTask (This was already converted correctly in the previous step)
    const updateTask = async (id, formData) => {
        try {
            const taskData = {
                ...formData,
                tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean) 
            };
            
            const res = await axios.put(`http://localhost:5000/api/tasks/${id}`, taskData);
            const updatedTask = res.data.task; 
            
            setTasks(prevTasks => prevTasks.map(task => 
                task._id === id ? updatedTask : task
            ));
            
            return updatedTask;
        } catch (error) {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.error("❌ Authentication Failed: Task update rejected by server.", error);
            }
            console.error("Error updating task:", error);
            throw new Error("Failed to update task due to server or network error.");
        }
    };

    // ✅ toggleTask (This was already converted correctly in the previous step)
    const toggleTask = async (id) => {
        try {
            const res = await axios.patch(`http://localhost:5000/api/tasks/${id}/toggle`);

            const toggledTask = res.data.task; 
            
            setTasks(prevTasks => prevTasks.map(task => 
                task._id === id ? toggledTask : task
            ));
            
        } catch (error) {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.error("❌ Authentication Failed: Task toggle rejected by server.");
            }
            
            if (error.message === 'Failed to fetch') {
                 console.error("⚠️ Network Error: Server likely offline or URL is wrong.");
            }
            
            console.error("Error toggling task:", error);
            throw new Error("Failed to toggle task due to server or network error.");
        }
    };
    
    // 🔴 FIX 3: deleteTask converted to axios.delete
    const deleteTask = async (id) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;

        try {
            // 🔥 REMOVED: const token = localStorage.getItem("token");
            
            // Use axios.delete: automatically sends secure cookie
            const res = await axios.delete(`http://localhost:5000/api/tasks/${id}`);

            // Remove from local state only if the request was successful
            if (res.status === 200 || res.status === 204) {
                setTasks(prevTasks => prevTasks.filter(task => task._id !== id));
            } else {
                 throw new Error("Server failed to delete task.");
            }
            
        } catch (error) {
            console.error("Error deleting task:", error);
            throw error;
        }
    };

    const toggleEmailReminder = async (id) => {
    try {
        // This hits the backend route we set up
        const res = await axios.patch(`http://localhost:5000/api/tasks/${id}/toggle-alert`);
        
        const updatedTask = res.data.task;
        
        // Update the list locally so the bell turns yellow immediately
        setTasks(prevTasks => prevTasks.map(task => 
            task._id === id ? updatedTask : task
        ));
        
        return updatedTask;
    } catch (error) {
        console.error("Error toggling email reminder:", error);
        throw error;
    }
};

    // ============================================
    // DERIVED STATE / HELPER FUNCTIONS
    // ============================================
    // (Rest of the file remains the same)

    const getTasksDueToday = () => {
        const today = new Date().toISOString().split('T')[0];
        
        return tasks.filter(task => 
            !task.completed && 
            task.dueDate && 
            new Date(task.dueDate).toISOString().split('T')[0] === today
        ).length;
    };


    const contextValue = {
        tasks,
        loading,
        fetchTasks,
        createTask,
        updateTask, 
        toggleTask,
        deleteTask,
        getTasksDueToday, 
        toggleEmailReminder,
    };

    return (
        <TaskContext.Provider value={contextValue}>
            {children}
        </TaskContext.Provider>
    );
};

// Custom hook for easy consumption
export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
};