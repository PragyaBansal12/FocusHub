// services/emailService.js

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// 🔥 IMPORTANT: You must configure your .env file with these variables
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider here (e.g., 'hotmail', 'sendgrid', etc.)
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app password
    },
});

/**
 * Sends a single email containing a list of overdue tasks.
 * @param {string} toEmail - The recipient's email address.
 * @param {Array<Object>} overdueTasks - An array of overdue task objects.
 */
export const sendOverdueAlertEmail = async (toEmail, overdueTasks) => {
    if (overdueTasks.length === 0) return;

    const taskListHtml = overdueTasks.map(task => `
        <li>
            <strong>${task.title}</strong> 
            (Due: ${new Date(task.dueDate).toDateString()})
            <p style="margin-top: 5px; font-size: 0.9em; color: #555;">${task.description || 'No description provided.'}</p>
        </li>
    `).join('');

    const mailOptions = {
        from: `FocusHub Alerts <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `🚨 Urgent: ${overdueTasks.length} Task(s) Overdue on FocusHub`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #d9534f;">Overdue Task Alert!</h2>
                <p>Hello,</p>
                <p>You have the following task(s) marked for an alert that are now past their due date:</p>
                <ul style="list-style-type: none; padding-left: 0;">
                    ${taskListHtml}
                </ul>
                <p>Please log in to FocusHub to complete or update these tasks.</p>
                <p style="margin-top: 20px; font-size: 0.9em; color: #888;">This is an automated reminder from FocusHub.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email alert sent to ${toEmail} for ${overdueTasks.length} task(s).`);
    } catch (error) {
        console.error(`❌ Error sending overdue email to ${toEmail}:`, error.message);
    }
};