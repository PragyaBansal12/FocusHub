// services/schedulerService.js

import cron from 'node-cron';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { sendOverdueAlertEmail } from './emailService.js';
import { sendPushNotification } from './pushNotificationService.js';

// The function that runs on the schedule
const checkExpirations = async () => {
    console.log('--- Running subscription expiration check ---');
    try {
        const expiredUsers = await User.find({
            subscriptionPlan: { $ne: 'free' },
            subscriptionExpiryDate: { $lt: new Date() }
        });

        for (const user of expiredUsers) {
            console.log(`Downgrading user ${user.email} (Expired on ${user.subscriptionExpiryDate})`);
            user.subscriptionPlan = 'free';
            user.subscriptionStatus = 'inactive';
            user.subscriptionExpiryDate = null;
            await user.save();
        }
        console.log(`--- Expiration check complete. ${expiredUsers.length} user(s) downgraded. ---`);
    } catch (error) {
        console.error('❌ Expiration Scheduler Error:', error.message);
    }
};

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

const checkUpcomingTaskReminders = async () => {
    try {
        const now = new Date();
        const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        const in1Hour = new Date(now.getTime() + 1 * 60 * 60 * 1000);

        // Check for 3-hour reminders (due between 2h58m and 3h02m from now)
        const in3HoursStart = new Date(now.getTime() + 3 * 60 * 60 * 1000 - 2 * 60 * 1000);
        const in3HoursEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000 + 2 * 60 * 1000);
        const tasks3h = await Task.find({
            completed: false,
            reminder3hSent: false,
            dueDate: { 
                $gte: in3HoursStart, 
                $lte: in3HoursEnd 
            }
        }).populate('user');

        for (const task of tasks3h) {
            const user = task.user;
            // Only send 3-hour reminder to premium users
            if (user && (user.subscriptionPlan === 'pro' || user.subscriptionPlan === 'yearly')) {
                if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                    const payload = {
                        title: 'Task Reminder',
                        body: `Your task "${task.title}" is due in about 3 hours.`
                    };
                    for (const sub of user.pushSubscriptions) {
                        await sendPushNotification(sub, payload);
                    }
                }
            }
            task.reminder3hSent = true;
            await task.save();
        }

        // Check for 1-hour reminders (due between 58m and 62m from now)
        const in1HourStart = new Date(now.getTime() + 1 * 60 * 60 * 1000 - 2 * 60 * 1000);
        const in1HourEnd = new Date(now.getTime() + 1 * 60 * 60 * 1000 + 2 * 60 * 1000);
        const tasks1h = await Task.find({
            completed: false,
            reminder1hSent: false,
            dueDate: { 
                $gte: in1HourStart, 
                $lte: in1HourEnd 
            }
        }).populate('user');

        for (const task of tasks1h) {
            const user = task.user;
            if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                const payload = {
                    title: 'Final Task Reminder',
                    body: `Your task "${task.title}" is due in about 1 hour.`
                };
                for (const sub of user.pushSubscriptions) {
                    await sendPushNotification(sub, payload);
                }
            }
            task.reminder1hSent = true;
            await task.save();
        }

    } catch (error) {
        console.error('❌ Push Scheduler Error:', error.message);
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
        timezone: "Asia/Kolkata" 
    });
    
    // Check for push notifications every minute for precise timing
    cron.schedule('* * * * *', checkUpcomingTaskReminders, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
    
    // Check for expired subscriptions daily at midnight
    cron.schedule('0 0 * * *', checkExpirations, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
    
    console.log('⏰ Overdue task scheduler initialized: Daily at 9:00 AM.');
    console.log('⏰ Subscription expiration scheduler initialized: Daily at Midnight.');
    console.log('⏰ Push notification reminder scheduler initialized: Every minute.');
};