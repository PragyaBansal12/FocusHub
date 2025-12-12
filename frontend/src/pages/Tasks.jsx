import React, { useState, useEffect } from "react";
import { Plus, Trash2, Check, Calendar, Tag } from "lucide-react";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    tags: ""
  });

  // ✅ Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/tasks", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch tasks");
      }
      
      const data = await res.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      alert("Failed to load tasks. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Create new task
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert("Please enter a task title");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean)
        })
      });

      if (!res.ok) {
        throw new Error("Failed to create task");
      }

      const result = await res.json();
      console.log("Task created:", result);

      // ✅ Refresh task list
      await fetchTasks();
      
      // ✅ Reset form and hide it
      setShowForm(false);
      setFormData({ title: "", description: "", dueDate: "", priority: "medium", tags: "" });
      
      alert("Task created successfully! ✅");
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    }
  }

  // ✅ Toggle task completion
  async function toggleTask(id) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/tasks/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Failed to toggle task");
      }

      await fetchTasks();
    } catch (error) {
      console.error("Error toggling task:", error);
      alert("Failed to update task");
    }
  }

  // ✅ Delete task
  async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Failed to delete task");
      }

      await fetchTasks();
      alert("Task deleted ✅");
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task");
    }
  }

  // ✅ Show loading state
  if (loading) {
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
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} total
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition"
        >
          <Plus size={18} /> 
          {showForm ? "Cancel" : "Add Task"}
        </button>
      </div>

      {/* ✅ Task Creation Form */}
      {showForm && (
        <form 
          onSubmit={handleSubmit} 
          className="mb-6 p-6 bg-white dark:bg-[#121318] rounded-xl shadow-md border border-gray-200 dark:border-gray-800"
        >
          <h3 className="font-semibold mb-4">Create New Task</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Complete DSA Assignment"
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                placeholder="Add more details about this task..."
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent resize-none"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                placeholder="e.g., DSA, Exams, Practice (comma separated)"
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#0b0f15] border border-gray-200 dark:border-gray-700 outline-none focus:border-accent"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              type="submit" 
              className="flex-1 py-3 bg-accent text-white rounded-lg hover:opacity-90 font-medium transition"
            >
              Create Task
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0b0f15] transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ✅ Task List */}
      <div className="space-y-3">
        {!showForm && tasks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#121318] rounded-xl">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first task to get started!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-accent text-white rounded-lg hover:opacity-90"
            >
              Create Task
            </button>
          </div>
        ) : tasks.length>0 ? (
          tasks.map((task) => {
            const priorityColors = {
              low: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
              medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
              high: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            };

            return (
              <div
                key={task._id}
                className="p-5 bg-white dark:bg-[#121318] rounded-xl shadow-md border border-gray-200 dark:border-gray-800 hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask(task._id)}
                    className={`mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center transition flex-shrink-0 ${
                      task.completed 
                        ? "bg-green-500 border-green-500" 
                        : "border-gray-300 dark:border-gray-600 hover:border-accent"
                    }`}
                  >
                    {task.completed && <Check size={16} className="text-white" />}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-lg ${
                      task.completed ? "line-through text-gray-400" : ""
                    }`}>
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {/* Priority Badge */}
                      <span className={`text-xs px-2 py-1 rounded ${priorityColors[task.priority]}`}>
                        {task.priority.toUpperCase()}
                      </span>

                      {/* Due Date */}
                      {task.dueDate && (
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}

                      {/* Tags */}
                      {task.tags?.map((tag, i) => (
                        <span 
                          key={i} 
                          className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded flex items-center gap-1"
                        >
                          <Tag size={12} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteTask(task._id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition flex-shrink-0"
                    title="Delete task"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        ) : null}
      </div>
    </div>
  );
}