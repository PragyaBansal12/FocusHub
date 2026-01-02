// services/schedulerService.js

import cron from 'node-cron';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { sendOverdueAlertEmail } from './emailService.js';

// The function that runs on the schedule
const checkOverdueTasks = async () => {
    console.log('--- Running overdue task check scheduler ---');

    try {
        // Find tasks that are:
        // 1. Not completed (completed: false)
        // 2. Have a due date in the past (dueDate: { $lt: new Date() })
        // 3. Have the alert toggle enabled (sendOverdueAlert: true)
        const overdueTasks = await Task.find({
            completed: false,
            dueDate: { $lt: new Date() },
            sendOverdueAlert: true,
        }).populate('user', 'email'); // Populate the user field to get the email

        // Group tasks by user ID for a single email per user
        const tasksByUser = overdueTasks.reduce((acc, task) => {
            const userId = task.user._id.toString();
            if (!acc[userId]) {
                acc[userId] = {
                    email: task.user.email,
                    tasks: [],
                };
            }
            acc[userId].tasks.push(task);
            return acc;
        }, {});

        // Send email to each user with their list of overdue tasks
        for (const userId in tasksByUser) {
            const { email, tasks } = tasksByUser[userId];
            await sendOverdueAlertEmail(email, tasks);
        }

        console.log(`--- Overdue task check complete. ${Object.keys(tasksByUser).length} user(s) notified. ---`);

    } catch (error) {
        console.error('❌ Scheduler Error:', error.message);
    }
};

/**
 * Starts the cron job.
 * Runs every day at 9:00 AM (0 9 * * *)
 */
export const startScheduler = () => {
    // Cron pattern: minute hour day-of-month month day-of-week
    // This runs daily at 9:00 AM local time
    cron.schedule('0 9 * * *', checkOverdueTasks, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Adjust to your preferred timezone for consistency
    });
    console.log('⏰ Overdue task scheduler initialized: Daily at 9:00 AM.');
};