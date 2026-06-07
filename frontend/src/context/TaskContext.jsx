import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios'; // axios is correctly imported

export const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);


    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {

            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks`);
            
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

    const createTask = async (formData) => {
        const finalDueDate = formData.dueDate ? new Date(formData.dueDate).toISOString() : null;

        //optimistic ui update
        const tempId = "temp-" + Date.now();
        const tempTask = {
            _id: tempId,
            ...formData,
            dueDate: finalDueDate,
            completed: false,
            createdAt: new Date().toISOString(),
            tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean) 
        };
        
        // Instantly add to UI
        setTasks(prev => [...prev, tempTask]);

        try {
            const taskData = {
                ...formData,
                dueDate: finalDueDate,
                tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean) 
            };
            
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks`, taskData);

            // Replace temp task with real task from server
            const resultTask = res.data.task; 
            setTasks(prev => prev.map(t => t._id === tempId ? resultTask : t)); 
            return resultTask; 
        } catch (error) {
            // Revert on failure
            setTasks(prev => prev.filter(t => t._id !== tempId));
            console.error("Error creating task:", error);
            throw error;
        }
    };
    
        const updateTask = async (id, formData) => {
        const previousTask = tasks.find(t => t._id === id);
        const finalDueDate = formData.dueDate ? new Date(formData.dueDate).toISOString() : null;
        
        // Optimistic UI Update
        const tempTask = {
            ...previousTask,
            ...formData,
            dueDate: finalDueDate,
            tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean)
        };
        setTasks(prevTasks => prevTasks.map(task => 
            task._id === id ? tempTask : task
        ));

        try {
            const taskData = {
                ...formData,
                dueDate: finalDueDate,
                tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean) 
            };
            
            const res = await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks/${id}`, taskData, { withCredentials: true });
            const updatedTask = res.data.task; 
            
            // Sync completely with server response
            setTasks(prevTasks => prevTasks.map(task => 
                task._id === id ? updatedTask : task
            ));
            
            return updatedTask;
        } catch (error) {
            // Revert optimistic update on failure
            setTasks(prevTasks => prevTasks.map(task => 
                task._id === id ? previousTask : task
            ));
            
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.error("Authentication Failed: Task update rejected by server.", error);
            }
            console.error("Error updating task:", error);
            throw new Error("Failed to update task due to server or network error.");
        }
    };

    const toggleTask = async (id) => {
        // 1. Save previous state for reverting on error
        const previousTask = tasks.find(t => t._id === id);
        if (!previousTask) return;

        // 2. Optimistically update local UI immediately
        setTasks(prevTasks => prevTasks.map(task => 
            task._id === id ? { ...task, completed: !task.completed } : task
        ));

        try {
            // 3. Make background request
            const res = await axios.patch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks/${id}/toggle`, {}, { withCredentials: true });
            
            // 4. Sync fully with server (picks up updated timestamps)
            setTasks(prevTasks => prevTasks.map(task => 
                task._id === id ? res.data.task : task
            ));
            
        } catch (error) {
            // 5. Revert optimistic update on failure
            setTasks(prevTasks => prevTasks.map(task => 
                task._id === id ? previousTask : task
            ));
            
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.error("Authentication Failed: Task toggle rejected by server.");
            }
            if (error.message === 'Failed to fetch') {
                 console.error("Network Error: Server likely offline or URL is wrong.");
            }
            
            console.error("Error toggling task:", error);
            throw new Error("Failed to toggle task due to server or network error.");
        }
    };
    
    const deleteTask = async (id) => {

        const previousTask = tasks.find(t => t._id === id);
        
        // Optimistic UI Delete
        setTasks(prevTasks => prevTasks.filter(task => task._id !== id));

        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks/${id}`);

            if (res.status !== 200 && res.status !== 204) {
                 throw new Error("Server failed to delete task.");
            }
            
        } catch (error) {
            if (previousTask) {
                setTasks(prevTasks => [...prevTasks, previousTask]);
            }
            console.error("Error deleting task:", error);
            throw error;
        }
    };

    const toggleEmailReminder = async (id) => {
        const previousTask = tasks.find(t => t._id === id);
        if (!previousTask) return;
        
        // Optimistic UI update
        setTasks(prevTasks => prevTasks.map(task => 
            task._id === id ? { ...task, emailAlerts: !task.emailAlerts } : task
        ));

        try {
            // This hits the backend route we set up
            const res = await axios.patch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks/${id}/toggle-alert`);
            
            const updatedTask = res.data.task;
            
            // Sync with server completely
            setTasks(prevTasks => prevTasks.map(task => 
                task._id === id ? updatedTask : task
            ));
            
            return updatedTask;
        } catch (error) {
            // Revert on failure
            setTasks(prevTasks => prevTasks.map(task => 
                task._id === id ? previousTask : task
            ));
            console.error("Error toggling email reminder:", error);
            throw error;
        }
    };


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

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
};