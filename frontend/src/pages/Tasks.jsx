import React, { useState, useEffect, useCallback } from "react";
import { useTasks } from "../context/TaskContext";
import { Plus, Trash2, Check, Calendar, Tag, Link, Settings2, Edit3, Bell } from "lucide-react"; 
import axios from 'axios';

const initialFormData = {
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    tags: ""
};

const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toISOString().split('T')[0];
};

export default function Tasks() {
    const {
        tasks,
        loading: tasksLoading,
        fetchTasks,
        createTask,
        updateTask,
        toggleTask,
        deleteTask,
        toggleEmailReminder,
    } = useTasks();

    const [showForm, setShowForm] = useState(false);
    const [isCalendarSynced, setIsCalendarSynced] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [alertUpdatingTaskId, setAlertUpdatingTaskId] = useState(null);

    // ============================================
    // GOOGLE CALENDAR SYNC LOGIC
    // ============================================
    const checkSyncStatus = useCallback(async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/calendar/status");
            setIsCalendarSynced(res.data.isSynced);
        } catch (error) {
            console.error("Failed to check calendar sync status:", error);
        }
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const syncStatus = urlParams.get('sync');

        if (syncStatus === 'success') {
            alert("✅ Google Calendar synced successfully! All active tasks with due dates are automatically added.");
            window.history.replaceState(null, null, window.location.pathname);
        } else if (syncStatus === 'error') {
            alert("❌ Failed to sync Google Calendar. Please try again.");
            window.history.replaceState(null, null, window.location.pathname);
        }
        checkSyncStatus();
    }, [checkSyncStatus]);

    async function handleCalendarSync() {
        try {
            const res = await axios.get("http://localhost:5000/api/calendar/google");
            if (res.status === 200) {
                const { authUrl } = res.data;
                window.location.href = authUrl;
            }
        } catch (error) {
            console.error("Error during calendar sync initiation:", error);
            alert("Failed to initiate Google Sync.");
        }
    }

    async function handleCalendarDisconnect() {
        if (!window.confirm("Are you sure you want to disconnect Google Calendar?")) return;
        try {
            const res = await axios.post("http://localhost:5000/api/calendar/disconnect");
            if (res.status === 200) {
                setIsCalendarSynced(false);
                alert("✅ Google Calendar disconnected.");
                checkSyncStatus();
            }
        } catch (error) {
            console.error("Error during calendar disconnect:", error);
            alert("❌ Failed to disconnect Google Calendar.");
        }
    }

    // ============================================
    // ALERT TOGGLE HANDLER (Updated for sendOverdueAlert)
    // ============================================
    const handleToggleEmailReminder = async (taskId) => {
        if (alertUpdatingTaskId) return;
        setAlertUpdatingTaskId(taskId); 
        try {
            const response = await axios.patch(
                `http://localhost:5000/api/tasks/${taskId}/toggle-alert`,
                {}, 
                { withCredentials: true }
            );

            if (response.status === 200) {
                if (fetchTasks) await fetchTasks();
            }
        } catch (error) {
            console.error("Error toggling email reminder:", error);
            alert("Could not update reminder settings. Make sure you are logged in.");
        } finally {
            setAlertUpdatingTaskId(null);
        }
    };

    // ============================================
    // TASK HANDLERS
    // ============================================
    const handleEdit = (task) => {
        if (!task) return;
        setFormData({
            title: task.title,
            description: task.description || "",
            dueDate: formatDateForInput(task.dueDate),
            priority: task.priority,
            tags: task.tags ? task.tags.join(', ') : "",
        });
        setEditingTask(task._id);
        setShowForm(true);
    };

    const handleNewTask = () => {
        setEditingTask(null);
        setFormData(initialFormData);
        setShowForm(true);
    }

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingTask(null);
        setFormData(initialFormData);
    };

    async function handleSubmit(e) {
        e.preventDefault();
        if (!formData.title.trim()) {
            alert("Please enter a task title");
            return;
        }
        try {
            if (editingTask) {
                await updateTask(editingTask, formData);
                alert("Task updated successfully! ✏️");
            } else {
                await createTask(formData);
                alert("Task created successfully! ✅");
            }
            handleCancelForm();
        } catch (error) {
            console.error("Error saving task:", error);
            alert("Failed to save task. Please try again.");
        }
    }

    async function handleToggleTask(id) {
        try { await toggleTask(id); } catch (error) { console.error("Error toggling task:", error); }
    }

    async function handleDeleteTask(id) {
        if (window.confirm("Delete this task?")) {
            try {
                await deleteTask(id);
                alert("Task deleted ✅");
            } catch (error) { console.error("Error deleting task:", error); }
        }
    }

    const incompleteTasksCount = tasks.filter(task => !task.completed).length;

    const sortedTasks = [...tasks].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
    });

    if (tasksLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">My Tasks</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {incompleteTasksCount} {incompleteTasksCount === 1 ? 'task' : 'tasks'} remaining
                    </p>
                </div>
                <div className="flex gap-3">
                    {isCalendarSynced ? (
                        <button onClick={handleCalendarDisconnect} className="flex items-center gap-2 px-4 py-2 text-red-500 border border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm">
                            <Settings2 size={18} /> Disconnect
                        </button>
                    ) : (
                        <button onClick={handleCalendarSync} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90 transition text-sm">
                            <Link size={18} /> Sync Calendar
                        </button>
                    )}
                    <button onClick={() => showForm ? handleCancelForm() : handleNewTask()} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition">
                        <Plus size={18} /> {showForm ? "Cancel" : "Add Task"}
                    </button>
                </div>
            </div>

            {/* Form Section */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white dark:bg-[#121318] rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                    <h3 className="font-semibold mb-4">{editingTask ? "Edit Task" : "Create New Task"}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Task Title <span className="text-red-500">*</span></label>
                            <input type="text" className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <textarea className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent resize-none" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Due Date</label>
                                <input type="date" className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Priority</label>
                                <select className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Tags</label>
                            <input type="text" className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button type="submit" className="flex-1 py-3 bg-accent text-white rounded-lg hover:opacity-90 font-medium transition">{editingTask ? "Save Changes" : "Create Task"}</button>
                        <button type="button" onClick={handleCancelForm} className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg transition">Cancel</button>
                    </div>
                </form>
            )}

            {/* Task List Section */}
            <div className="space-y-3">
                {!showForm && sortedTasks.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-[#121318] rounded-xl">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                        <button onClick={handleNewTask} className="px-6 py-2 bg-accent text-white rounded-lg hover:opacity-90">Create Task</button>
                    </div>
                ) : (
                    sortedTasks.map((task) => {
                        const priorityColors = {
                            low: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                            medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
                            high: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        };
                        const isAlertUpdating = alertUpdatingTaskId === task._id;
                        const isToggleDisabled = task.completed || !task.dueDate || isAlertUpdating;

                        return (
                            <div key={task._id} className={`p-5 bg-white dark:bg-[#121318] rounded-xl shadow-md border border-gray-200 dark:border-gray-800 hover:shadow-lg transition ${task.completed ? 'opacity-70' : ''}`}>
                                <div className="flex items-start gap-4">
                                    <button onClick={() => handleToggleTask(task._id)} className={`mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center transition flex-shrink-0 ${task.completed ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-gray-600 hover:border-accent"}`}>
                                        {task.completed && <Check size={16} className="text-white" />}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-semibold text-lg ${task.completed ? "line-through text-gray-400 dark:text-gray-500" : ""}`}>{task.title}</h3>
                                        {task.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>}
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            <span className={`text-xs px-2 py-1 rounded ${priorityColors[task.priority]}`}>{task.priority.toUpperCase()}</span>
                                            {task.dueDate && (
                                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded flex items-center gap-1">
                                                    <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                            {isCalendarSynced && task.dueDate && task.googleEventId && !task.completed && (
                                                <span className="text-xs px-2 py-1 rounded flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                    <Link size={12} /> Synced
                                                </span>
                                            )}
                                            {task.tags?.map((tag, i) => (
                                                <span key={i} className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded flex items-center gap-1">
                                                    <Tag size={12} /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {/* ALERT TOGGLE BELL */}
                                        <button
                                            onClick={() => handleToggleEmailReminder(task._id)}
                                            disabled={isToggleDisabled}
                                            className={`p-2 rounded transition flex-shrink-0 ${
                                                isToggleDisabled ? 'text-gray-200 cursor-not-allowed' : 
                                                task.sendOverdueAlert ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-400 hover:bg-gray-100'
                                            }`}
                                            title={isToggleDisabled ? (task.completed ? "Alerts disabled for completed tasks" : "Alerts require a due date") : (task.sendOverdueAlert ? "Disable email alert" : "Enable email alert")}
                                        >
                                            {isAlertUpdating ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                            ) : (
                                                <Bell size={18} fill={task.sendOverdueAlert && !isToggleDisabled ? "currentColor" : "none"} />
                                            )}
                                        </button>

                                        <button onClick={() => handleEdit(task)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition flex-shrink-0">
                                            <Edit3 size={18} />
                                        </button>
                                        <button onClick={() => handleDeleteTask(task._id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition flex-shrink-0">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}