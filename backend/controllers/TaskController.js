import Task from "../models/Task.js";
import User from "../models/User.js"; 
import { getCalendarClient } from './calendarController.js'; 

// ===================================
// CALENDAR HELPER FUNCTIONS
// ===================================

// Helper to remove event from Google Calendar and clear local ID
const deleteTaskEvent = async (userId, task) => {
    // Only proceed if there is a Google Event ID to delete
    if (!task.googleEventId) return;

    try {
        const calendar = await getCalendarClient(userId);
        if (!calendar) return;

        const user = await User.findById(userId);
        const calendarId = user?.googleCalendar?.calendarId || 'primary';
        
        await calendar.events.delete({ calendarId, eventId: task.googleEventId });
        console.log("🗑️ Google Event deleted:", task.googleEventId);
        
        // Always clear the local ID after a successful (or assumed successful) deletion attempt
        await Task.findByIdAndUpdate(task._id, { $set: { googleEventId: null, googleCalendarId: null } });

    } catch (err) {
        // Suppress 404 (Not Found) or 410 (Gone) errors, as this means the event is already gone.
        if (err.code !== 404 && err.code !== 410) {
            console.error("❌ Error deleting Google Calendar event:", err.message);
        }
        // If an error occurred, we still assume we should clean up the local ID just in case.
        await Task.findByIdAndUpdate(task._id, { $set: { googleEventId: null, googleCalendarId: null } });
    }
};

// 🔥 CRITICAL FIX: Helper to create or update event in Google Calendar
const syncTaskToCalendar = async (userId, task) => {
    // 1. Skip if task is completed or has no due date
    if (task.completed || !task.dueDate) {
        // If it was completed or lost its due date, ensure event is deleted if it exists
        if (task.googleEventId) {
            await deleteTaskEvent(userId, task);
        }
        return; 
    }

    const calendar = await getCalendarClient(userId);
    if (!calendar) return;

    try {
        const user = await User.findById(userId);
        const calendarId = user?.googleCalendar?.calendarId || 'primary';
        
        const dateString = new Date(task.dueDate).toISOString().split('T')[0];
        
        // Google Calendar requires end date to be the day after for all-day events
        const endDate = new Date(new Date(task.dueDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const eventBody = {
            summary: task.title,
            description: task.description || 'Task from FocusHub',
            start: { date: dateString },
            end: { date: endDate },
        };

        let eventResponse;
        
        if (task.googleEventId) {
            // Update existing event
            eventResponse = await calendar.events.update({
                calendarId,
                eventId: task.googleEventId,
                requestBody: eventBody,
            });
        } else {
            // Create new event
            eventResponse = await calendar.events.insert({
                calendarId,
                requestBody: eventBody,
            });
        }

        // Update the task document with the new/updated Google Event ID
        if (eventResponse.data.id !== task.googleEventId) {
             await Task.findByIdAndUpdate(task._id, { 
                $set: { 
                    googleEventId: eventResponse.data.id,
                    googleCalendarId: calendarId,
                } 
            });
        }
    } catch (err) {
        console.error("❌ Calendar Sync Error (Create/Update):", err.message);
        // Do not re-throw, just log and let the main function succeed
    }
};


// ===================================
// TASK CRUD OPERATIONS (INTEGRATED)
// ===================================

// ✅ GET all tasks for logged-in user
export async function getTasks(req, res) {
    try {
        const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 }); 
        res.json({ tasks });
    } catch (err) {
        res.status(500).json({ message: "Error fetching tasks", error: err.message });
    }
}

// ✅ CREATE new task
export async function createTask(req, res) {
    try {
        const { title, description, dueDate, priority, tags } = req.body;
        // ... (validation logic remains the same) ...
        if (!title || title.trim() === "") {
            return res.status(400).json({ message: "Title is required" });
        }
        
        const taskData = {
            user: req.user.id, 
            title,
            description,
            priority,
            tags
        };
        
        if (dueDate && dueDate.trim() !== "") {
            taskData.dueDate = dueDate;
        }
        
        let task = await Task.create(taskData);
        
        // 🔥 INTEGRATION: Sync to Calendar
        await syncTaskToCalendar(req.user.id, task); 
        
        // Re-fetch the task to get the potentially updated googleEventId
        task = await Task.findById(task._id); 

        res.status(201).json({ message: "Task created", task });
    } catch (err) {
        console.error("Mongoose/Server Error creating task:", err.message); 
        res.status(500).json({ message: "Error creating task", error: err.message });
    }
}

// ✅ UPDATE task
export async function updateTask(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Handle due date clearing correctly
        if (updates.dueDate === "") {
            updates.dueDate = null; 
        }
        
        let task = await Task.findOne({ _id: id, user: req.user.id }); 
        
        if (!task) {
            return res.status(404).json({ message: "Task not found or unauthorized" });
        }
        
        Object.assign(task, updates);
        await task.save();

        // 🔥 INTEGRATION: Sync to Calendar (will delete event if dueDate is null/completed, or update/create otherwise)
        await syncTaskToCalendar(req.user.id, task); 
        
        // Re-fetch the task to get the potentially updated googleEventId
        task = await Task.findById(task._id); 
        
        res.json({ message: "Task updated", task });
    } catch (err) {
        res.status(500).json({ message: "Error updating task", error: err.message });
    }
}

// ✅ DELETE task
export async function deleteTask(req, res) {
    try {
        const { id } = req.params;
        
        const task = await Task.findOneAndDelete({ _id: id, user: req.user.id }); 
        
        if (!task) {
            return res.status(404).json({ message: "Task not found or unauthorized" });
        }
        
        // 🔥 INTEGRATION: Delete event from Calendar
        await deleteTaskEvent(req.user.id, task); 
        
        res.json({ message: "Task deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting task", error: err.message });
    }
}

// ✅ TOGGLE task completion
// Note: This function name matches the one exported in your TaskRoutes.js
export async function toggleTask(req, res) {
    try {
        const { id } = req.params;
        
        let task = await Task.findOne({ _id: id, user: req.user.id }); 
        
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        
        // 1. Toggle the completed status
        task.completed = !task.completed;
        await task.save();
        
        // 2. 🔥 INTEGRATION: Sync to Calendar
        // If completed: syncTaskToCalendar will call deleteTaskEvent
        // If incomplete: syncTaskToCalendar will re-add/update the event
        await syncTaskToCalendar(req.user.id, task); 
        
        // 3. Re-fetch the task as syncTaskToCalendar might update googleEventId/googleCalendarId
        task = await Task.findById(task._id); 
        
        res.json({ message: "Task toggled", task });
    } catch (err) {
        console.error("Error in toggleTask:", err.message);
        res.status(500).json({ message: "Error toggling task", error: err.message });
    }
}

export async function toggleOverdueAlert(req, res) {
    try {
        const { id } = req.params;
        
        // 1. Find the task and ensure it belongs to the user
        let task = await Task.findOne({ _id: id, user: req.user.id }); 
        
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        
        // 2. Toggle the sendOverdueAlert status
        task.sendOverdueAlert = !task.sendOverdueAlert;
        await task.save();
        
        // 3. Return the updated task
        res.json({ 
            message: "Overdue alert toggled", 
            task: {
                _id: task._id,
                sendOverdueAlert: task.sendOverdueAlert // Return only necessary fields or the whole task
            } 
        });
    } catch (err) {
        console.error("Error in toggleOverdueAlert:", err.message);
        res.status(500).json({ message: "Error toggling overdue alert", error: err.message });
    }
}