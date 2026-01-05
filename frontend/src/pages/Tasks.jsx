import React, { useState, useEffect, useCallback } from "react";
import { useTasks } from "../context/TaskContext";
import { Plus, Trash2, Check, Calendar, Tag, Link, Settings2, Edit3, Bell, ListChecks } from "lucide-react"; 
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
    } = useTasks();

    const [showForm, setShowForm] = useState(false);
    const [isCalendarSynced, setIsCalendarSynced] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [alertUpdatingTaskId, setAlertUpdatingTaskId] = useState(null);

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
            alert("✅ Google Calendar synced successfully!");
            window.history.replaceState(null, null, window.location.pathname);
        } else if (syncStatus === 'error') {
            alert("❌ Failed to sync Google Calendar.");
            window.history.replaceState(null, null, window.location.pathname);
        }
        checkSyncStatus();
    }, [checkSyncStatus]);

    async function handleCalendarSync() {
        try {
            const res = await axios.get("http://localhost:5000/api/calendar/google");
            if (res.status === 200) { window.location.href = res.data.authUrl; }
        } catch (error) { console.error("Error sync initiation:", error); }
    }

    async function handleCalendarDisconnect() {
        if (!window.confirm("Disconnect Google Calendar?")) return;
        try {
            const res = await axios.post("http://localhost:5000/api/calendar/disconnect");
            if (res.status === 200) { setIsCalendarSynced(false); checkSyncStatus(); }
        } catch (error) { console.error("Error disconnect:", error); }
    }

    const handleToggleEmailReminder = async (taskId) => {
        if (alertUpdatingTaskId) return;
        setAlertUpdatingTaskId(taskId); 
        try {
            const response = await axios.patch(`http://localhost:5000/api/tasks/${taskId}/toggle-alert`, {}, { withCredentials: true });
            if (response.status === 200) { if (fetchTasks) await fetchTasks(); }
        } catch (error) { console.error("Error toggling email reminder:", error);
        } finally { setAlertUpdatingTaskId(null); }
    };

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
        if (!formData.title.trim()) return;
        try {
            if (editingTask) { await updateTask(editingTask, formData); } 
            else { await createTask(formData); }
            handleCancelForm();
        } catch (error) { console.error("Error saving task:", error); }
    }

    async function handleToggleTask(id) {
        try { await toggleTask(id); } catch (error) { console.error("Error toggling task:", error); }
    }

    async function handleDeleteTask(id) {
        // REMOVED window.confirm here to prevent double popups 
        // as your TaskContext likely handles the confirmation logic.
        try { 
            await deleteTask(id); 
        } catch (error) { 
            console.error("Error deleting task:", error); 
        }
    }

    const incompleteTasksCount = tasks.filter(task => !task.completed).length;
    const sortedTasks = [...tasks].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (tasksLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                        <ListChecks size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Task Manager</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {incompleteTasksCount} active {incompleteTasksCount === 1 ? 'task' : 'tasks'} for today
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {isCalendarSynced ? (
                        <button onClick={handleCalendarDisconnect} className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 transition text-sm font-medium">
                            <Settings2 size={16} /> Disconnect
                        </button>
                    ) : (
                        <button onClick={handleCalendarSync} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm font-medium border border-slate-200 dark:border-slate-700">
                            <Link size={16} /> Sync Calendar
                        </button>
                    )}
                    <button onClick={() => showForm ? handleCancelForm() : handleNewTask()} className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition shadow-lg ${showForm ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200" : "bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700"}`}>
                        {showForm ? "Cancel" : <><Plus size={18} /> New Task</>}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleSubmit} className="p-8 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/50">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            {editingTask ? <Edit3 size={18} className="text-indigo-500" /> : <Plus size={18} className="text-indigo-500" />}
                            {editingTask ? "Edit Task" : "Create New Task"}
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Task Title</label>
                                <input type="text" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-900 dark:text-white" placeholder="What needs to be done?" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Description (Optional)</label>
                                <textarea className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-900 dark:text-white resize-none" rows="2" placeholder="Add more details..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Due Date</label>
                                    <input type="date" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-900 dark:text-white" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Priority</label>
                                    <select className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-900 dark:text-white appearance-none" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Tags (Comma separated)</label>
                                <input type="text" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-900 dark:text-white" placeholder="study, homework, urgent" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition shadow-lg shadow-indigo-500/20">
                                {editingTask ? "Update Task" : "Create Task"}
                            </button>
                            <button type="button" onClick={handleCancelForm} className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition font-medium">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {!showForm && sortedTasks.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-[#1E293B] rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ListChecks size={32} className="text-slate-300 dark:text-slate-700" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">All caught up!</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">You have no tasks remaining.</p>
                        <button onClick={handleNewTask} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition shadow-lg shadow-indigo-500/20">
                            Get started
                        </button>
                    </div>
                ) : (
                    sortedTasks.map((task) => {
                        const priorityColors = {
                            low: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
                            medium: "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
                            high: "bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                        };
                        const isAlertUpdating = alertUpdatingTaskId === task._id;
                        const isToggleDisabled = task.completed || !task.dueDate || isAlertUpdating;

                        return (
                            <div key={task._id} className={`group p-5 bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border transition-all hover:shadow-md ${task.completed ? 'border-transparent opacity-60 bg-slate-50/50 dark:bg-slate-900/40' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/30'}`}>
                                <div className="flex items-start gap-4">
                                    <button 
                                        onClick={() => handleToggleTask(task._id)} 
                                        className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition flex-shrink-0 ${task.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-900"}`}
                                    >
                                        {task.completed && <Check size={14} className="text-white stroke-[3px]" />}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                                            <h3 className={`font-bold text-base leading-tight ${task.completed ? "line-through text-slate-400 dark:text-slate-600" : "text-slate-900 dark:text-white"}`}>
                                                {task.title}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-tighter ${priorityColors[task.priority]}`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {task.description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{task.description}</p>}
                                        
                                        <div className="flex flex-wrap items-center gap-3">
                                            {task.dueDate && (
                                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                    <Calendar size={13} className="text-indigo-500" /> {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                            {isCalendarSynced && task.dueDate && task.googleEventId && !task.completed && (
                                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    <Link size={11} /> Synced
                                                </span>
                                            )}
                                            {task.tags?.map((tag, i) => (
                                                <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                                    <Tag size={10} /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* FIXED: Removed opacity-0 to make buttons always visible */}
                                    <div className="flex items-center gap-1 flex-shrink-0 transition-opacity">
                                        <button
                                            onClick={() => handleToggleEmailReminder(task._id)}
                                            disabled={isToggleDisabled}
                                            className={`p-2 rounded-lg transition-colors ${
                                                isToggleDisabled ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed' : 
                                                task.sendOverdueAlert ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                            title="Email Reminder"
                                        >
                                            {isAlertUpdating ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                                            ) : (
                                                <Bell size={18} fill={task.sendOverdueAlert && !isToggleDisabled ? "currentColor" : "none"} />
                                            )}
                                        </button>

                                        {!task.completed && (
                                            <button onClick={() => handleEdit(task)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                                                <Edit3 size={18} />
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteTask(task._id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
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