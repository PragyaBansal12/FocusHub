import Task from "../models/Task.js";

// ✅ GET all tasks for logged-in user
export async function getTasks(req, res) {
  try {
    console.log("📥 Fetching tasks for user:", req.userId);
    
    const tasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 });
    
    console.log(`✅ Found ${tasks.length} tasks`);
    
    res.json({ tasks });
  } catch (err) {
    console.error("❌ Error in getTasks:", err);
    res.status(500).json({ 
      message: "Error fetching tasks", 
      error: err.message 
    });
  }
}

// ✅ CREATE new task
export async function createTask(req, res) {
  try {
    console.log("📥 Creating task for user:", req.userId);
    console.log("Request body:", req.body);
    
    const { title, description, dueDate, priority, tags } = req.body;

    // Validation
    if (!title || title.trim() === "") {
      console.log("❌ Validation failed: No title");
      return res.status(400).json({ message: "Title is required" });
    }
    
    // ✅ Build task data object
    const taskData = {
      user: req.userId,
      title,
      description,
      priority,
      tags
    };
    
    // ✅ Only add dueDate if it's provided and not empty
    if (dueDate && dueDate.trim() !== "") {
      taskData.dueDate = dueDate;
    }
    
    const task = await Task.create(taskData);
    
    console.log("✅ Task created successfully:", task._id);
    
    res.status(201).json({ message: "Task created", task });
  } catch (err) {
    console.error("❌ Error in createTask:", err);
    res.status(500).json({ 
      message: "Error creating task", 
      error: err.message 
    });
  }
}

// ✅ UPDATE task
export async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log("📝 Updating task:", id);
    
    // ✅ Handle empty dueDate in updates
    if (updates.dueDate === "") {
      updates.dueDate = null;
    }
    
    const task = await Task.findOne({ _id: id, user: req.userId });
    
    if (!task) {
      console.log("❌ Task not found");
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }
    
    Object.assign(task, updates);
    await task.save();
    
    console.log("✅ Task updated");
    
    res.json({ message: "Task updated", task });
  } catch (err) {
    console.error("❌ Error in updateTask:", err);
    res.status(500).json({ message: "Error updating task", error: err.message });
  }
}

// ✅ DELETE task
export async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    
    console.log("🗑️ Deleting task:", id);
    
    const task = await Task.findOneAndDelete({ _id: id, user: req.userId });
    
    if (!task) {
      console.log("❌ Task not found");
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }
    
    console.log("✅ Task deleted");
    
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("❌ Error in deleteTask:", err);
    res.status(500).json({ message: "Error deleting task", error: err.message });
  }
}

// ✅ TOGGLE task completion
export async function toggleTask(req, res) {
  try {
    const { id } = req.params;
    
    console.log("🔄 Toggling task:", id);
    
    const task = await Task.findOne({ _id: id, user: req.userId });
    
    if (!task) {
      console.log("❌ Task not found");
      return res.status(404).json({ message: "Task not found" });
    }
    
    task.completed = !task.completed;
    await task.save();
    
    console.log("✅ Task toggled to:", task.completed);
    
    res.json({ message: "Task toggled", task });
  } catch (err) {
    console.error("❌ Error in toggleTask:", err);
    res.status(500).json({ message: "Error toggling task", error: err.message });
  }
}
