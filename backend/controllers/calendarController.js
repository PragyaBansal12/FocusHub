import { config } from 'dotenv';
import { google } from 'googleapis';
import User from '../models/User.js'; 
import jwt from 'jsonwebtoken'; 

config(); 

// 1. Helper to Setup OAuth2 Client per request
const getOAuth2Client = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
};

// Define the scopes (permissions) required
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export const getCalendarClient = async (userId) => { 
    const user = await User.findById(userId);
    if (!user || !user.googleCalendar || !user.googleCalendar.refreshToken) {
        return null; 
    }

    const client = getOAuth2Client();
    client.setCredentials({ refresh_token: user.googleCalendar.refreshToken });

    // Check if token is expired or close to expiring (within a 5-minute buffer)
    if (!user.googleCalendar.accessToken || Date.now() >= user.googleCalendar.tokenExpiryDate.getTime() - 5 * 60 * 1000) {
        try {
            const { credentials } = await client.refreshAccessToken();
            
            const updateFields = {
                'googleCalendar.accessToken': credentials.access_token,
                'googleCalendar.tokenExpiryDate': new Date(credentials.expiry_date),
            };
            
            if (credentials.refresh_token) {
                updateFields['googleCalendar.refreshToken'] = credentials.refresh_token;
            }

            await User.findByIdAndUpdate(userId, {
                $set: updateFields
            });
            client.setCredentials(credentials); 
        } catch (error) {
            console.error("Error refreshing Google Access Token:", error.message);
            
            // If the refresh token is invalid/expired/revoked, automatically disconnect the calendar
            if (error.message.includes('invalid_grant') || error.message.includes('expired') || error.message.includes('revoked')) {
                console.log(`Clearing expired/invalid Google Calendar credentials for user ${userId}`);
                await User.findByIdAndUpdate(userId, {
                    $unset: { googleCalendar: 1 }
                });
            }
            return null;
        }
    }
    
    return google.calendar({ version: 'v3', auth: client });
};

export const googleAuth = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const plan = user?.subscriptionPlan || 'free';
        if (plan === 'free') {
            return res.status(403).json({ message: "Google Calendar sync is a premium feature. Please upgrade to Pro or Yearly." });
        }

        const client = getOAuth2Client();
        const authUrl = client.generateAuthUrl({
            access_type: 'offline', 
            scope: SCOPES,
            prompt: 'consent', 
            state: req.user.id, 
        });
        res.json({ authUrl });
    } catch (error) {
        console.error("Error generating Google Auth URL:", error);
        res.status(500).json({ message: "Failed to initialize Google Calendar sync." });
    }
};

export const googleAuthCallback = async (req, res) => {
    const { code, state: userId } = req.query;
    const FRONTEND_URL = "http://localhost:5173"; 

    try {
        const client = getOAuth2Client();
        // 1. Exchange the authorization code for tokens
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        // 2. Determine token expiry safely
        // Use tokens.expiry_date (epoch milliseconds) if available, or fall back to tokens.expires_in (seconds) or 1 hour.
        let expiryDate;
        if (tokens.expiry_date) {
            expiryDate = new Date(tokens.expiry_date);
        } else if (tokens.expires_in) {
            expiryDate = new Date(Date.now() + tokens.expires_in * 1000);
        } else {
            expiryDate = new Date(Date.now() + 3600 * 1000); // 1 hour default fallback
        }

        // 3. Find and update the user with the new token information safely
        const updateFields = {
            'googleCalendar.accessToken': tokens.access_token,
            'googleCalendar.tokenExpiryDate': expiryDate,
            'googleCalendar.calendarId': process.env.GOOGLE_CALENDAR_ID || 'primary',
        };

        if (tokens.refresh_token) {
            updateFields['googleCalendar.refreshToken'] = tokens.refresh_token;
        }

        await User.findByIdAndUpdate(userId, {
            $set: updateFields
        });

        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to false for localhost/http development
            maxAge: 7 * 24 * 60 * 60 * 1000, 
            sameSite: 'Lax', // Allows cookie to be sent on redirect from external domain
        });

        // 4. Redirect the now-authenticated user to the /tasks page
        res.redirect(`${FRONTEND_URL}/tasks?sync=success`);

    } catch (error) {
        const errorCode = error.response?.data?.error || error.message || 'unknown_error';
        console.error("=== Google Calendar OAuth Error ===");
        console.error("Error message:", error.message);
        console.error("Error response data:", error.response?.data);
        console.error("Error code:", errorCode);
        console.error("===================================");
        res.redirect(`${FRONTEND_URL}/tasks?sync=error&reason=${encodeURIComponent(errorCode)}`);
    }
};

export const checkSyncStatus = async (req, res) => {
    const user = await User.findById(req.user.id); 
    // Check if the refreshToken exists to determine sync status
    const isSynced = user && user.googleCalendar && user.googleCalendar.refreshToken != null; 
    res.json({ isSynced });
};

export const disconnectCalendar = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.googleCalendar || !user.googleCalendar.refreshToken) {
            return res.status(200).json({ message: "Calendar already disconnected." });
        }
        
        // 1. Attempt to revoke the token on Google's side
        try {
            const client = getOAuth2Client();
            client.setCredentials({ refresh_token: user.googleCalendar.refreshToken });
            await client.revokeCredentials();
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