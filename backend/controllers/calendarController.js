// controllers/calendarController.js - FINAL CORRECTED VERSION

import { config } from 'dotenv';
import { google } from 'googleapis';
import User from '../models/User.js'; 
import jwt from 'jsonwebtoken'; // 🔥 1. CRITICAL: Import jsonwebtoken for creating the user token

config(); 

// 1. Setup OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Define the scopes (permissions) required
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// ----------------------------------------------------
// 🔥 EXPORTED: HELPER FUNCTION TO GET CALENDAR API CLIENT
// ----------------------------------------------------
export const getCalendarClient = async (userId) => { 
    const user = await User.findById(userId);
    if (!user || !user.googleCalendar || !user.googleCalendar.refreshToken) {
        return null; 
    }

    oauth2Client.setCredentials({ refresh_token: user.googleCalendar.refreshToken });

    if (!user.googleCalendar.accessToken || Date.now() >= user.googleCalendar.tokenExpiryDate.getTime()) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            
            await User.findByIdAndUpdate(userId, {
                $set: {
                    'googleCalendar.accessToken': credentials.access_token,
                    'googleCalendar.tokenExpiryDate': new Date(credentials.expiry_date),
                }
            });
            oauth2Client.setCredentials(credentials); 
        } catch (error) {
            console.error("Error refreshing Google Access Token:", error.message);
            return null;
        }
    }
    
    return google.calendar({ version: 'v3', auth: oauth2Client });
};
// ----------------------------------------------------

// ----------------------------------------------------
// 1. Initiate Google OAuth Flow (GET /api/calendar/google)
// ----------------------------------------------------
export const googleAuth = (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', 
        scope: SCOPES,
        prompt: 'consent', 
        state: req.user.id, 
    });
    res.json({ authUrl });
};

// ----------------------------------------------------
// 2. Google OAuth Callback (GET /api/calendar/google/callback)
// ----------------------------------------------------
export const googleAuthCallback = async (req, res) => {
    const { code, state: userId } = req.query;
    const FRONTEND_URL = "http://localhost:5173"; 

    try {
        // 1. Exchange the authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // 2. Determine token expiry
        // Calculate the actual expiry date based on current time + expiresIn seconds
        const expiryDate = new Date(Date.now() + tokens.expires_in * 1000); 

        // 3. Find and update the user with the new token information
        await User.findByIdAndUpdate(userId, {
            $set: {
                'googleCalendar.accessToken': tokens.access_token,
                // Only save the refresh token if it was provided (first time sync)
                'googleCalendar.refreshToken': tokens.refresh_token || undefined, 
                'googleCalendar.tokenExpiryDate': expiryDate,
                'googleCalendar.calendarId': process.env.GOOGLE_CALENDAR_ID || 'primary',
            }
        });

        // 🔥 2. CRITICAL FIX: Sign a new JWT for the user 
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: '7d', // Use your standard token expiry
        });

        // 🔥 3. CRITICAL FIX: Set the JWT cookie to re-authenticate the user
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to false for localhost/http development
            maxAge: 7 * 24 * 60 * 60 * 1000, 
            sameSite: 'Lax', // Allows cookie to be sent on redirect from external domain
        });

        // 4. Redirect the now-authenticated user to the /tasks page
        res.redirect(`${FRONTEND_URL}/tasks?sync=success`);

    } catch (error) {
        console.error("Error during Google OAuth callback:", error);
        res.redirect(`${FRONTEND_URL}/tasks?sync=error`);
    }
};

// ----------------------------------------------------
// 3. Check Sync Status (GET /api/calendar/status)
// ----------------------------------------------------
export const checkSyncStatus = async (req, res) => {
    const user = await User.findById(req.user.id); 
    // Check if the refreshToken exists to determine sync status
    const isSynced = user && user.googleCalendar && user.googleCalendar.refreshToken != null; 
    res.json({ isSynced });
};

// ----------------------------------------------------
// 4. Disconnect Calendar (DELETE /api/calendar/disconnect)
// ----------------------------------------------------
export const disconnectCalendar = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.googleCalendar || !user.googleCalendar.refreshToken) {
            return res.status(200).json({ message: "Calendar already disconnected." });
        }
        
        // 1. Attempt to revoke the token on Google's side
        try {
            oauth2Client.setCredentials({ refresh_token: user.googleCalendar.refreshToken });
            await oauth2Client.revokeCredentials();
        } catch (revokeError) {
            // Log the error but continue to remove local credentials
            console.warn("Could not revoke Google token. Credentials may have expired on Google's side.", revokeError.message);
        }
        
        // 2. Remove the Google Calendar data from the user's document
        await User.findByIdAndUpdate(req.user.id, {
            $unset: { googleCalendar: 1 } // Completely removes the googleCalendar object
        });

        res.status(200).json({ message: "Google Calendar successfully disconnected." });

    } catch (error) {
        // This catch handles database errors or errors before revocation
        console.error("Error during calendar disconnect:", error);
        
        // Attempt local cleanup just in case
        await User.findByIdAndUpdate(req.user.id, {
            $unset: { googleCalendar: 1 } 
        }).catch(dbErr => console.error("Secondary DB cleanup failed:", dbErr));

        res.status(500).json({ error: "Failed to disconnect calendar." });
    }
};