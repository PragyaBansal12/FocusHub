import express from 'express';
import { authMiddleware as protect } from '../middleware/authMiddleware.js';
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    toggleOverdueAlert,
} from '../controllers/TaskController.js';

const router = express.Router();

// All task routes require authentication (protect middleware)

// GET /api/tasks - Get all tasks
// POST /api/tasks - Create a new task
router.route('/')
    .get(protect, getTasks)
    .post(protect, createTask);

// PUT /api/tasks/:id - Update a task
// DELETE /api/tasks/:id - Delete a task
router.route('/:id')
    .put(protect, updateTask)
    .delete(protect, deleteTask);

// PATCH /api/tasks/:id/toggle - Toggle task completion status
router.patch('/:id/toggle', protect, toggleTask);

router.patch('/:id/toggle-alert',protect,toggleOverdueAlert);

// REMOVED: The manual sync route is no longer needed:
// router.patch('/:id/sync_to_calendar', protect, manualSyncTaskToCalendar);

export default router;