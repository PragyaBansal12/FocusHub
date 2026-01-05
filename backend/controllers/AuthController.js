import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from 'google-auth-library';

// Initialize Google Client
const client = new OAuth2Client(process.env.GOOGLE_LOGIN_CLIENT_ID);

// Helper to provide a default avatar if none exists
const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=random&color=fff&name=";

/**
 * HELPER: Standardize Token Response
 * Sets the cookie and sends the user data back to frontend
 */
const sendTokenResponse = (user, statusCode, res, message) => {
    const appToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    res.cookie("token", appToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(statusCode).json({
        message,
        token: appToken,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture || (DEFAULT_AVATAR + encodeURIComponent(user.name))
        }
    });
};

// --- GOOGLE LOGIN (Existing Users Only) ---
export async function googleLogin(req, res) {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_LOGIN_CLIENT_ID,
        });

        const { email } = ticket.getPayload();
        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });

        // 🔥 VALIDATION: If user doesn't exist, don't allow login
        if (!user) {
            return res.status(404).json({ 
                message: "No account found with this email. Please Sign Up first." 
            });
        }

        sendTokenResponse(user, 200, res, "Google login successful");

    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(400).json({ message: "Google verification failed", error: error.message });
    }
}

// --- GOOGLE SIGNUP (New Users Only) ---
export async function googleSignup(req, res) {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_LOGIN_CLIENT_ID,
        });

        const { name, email, picture, sub } = ticket.getPayload();
        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });

        // 🔥 VALIDATION: If user already exists, don't allow duplicate signup
        if (existingUser) {
            return res.status(400).json({ 
                message: "An account already exists with this email. Please Log In." 
            });
        }

        // Create the new user
        const newUser = await User.create({
            name,
            email: normalizedEmail,
            profilePicture: picture,
            googleId: sub,
        });

        sendTokenResponse(newUser, 201, res, "Google signup successful");

    } catch (error) {
        console.error("Google Signup Error:", error);
        res.status(400).json({ message: "Google signup failed", error: error.message });
    }
}

// --- STANDARD SIGNUP CONTROLLER ---
export async function signup(req, res) {
    try {
        const { name, email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const exists = await User.findOne({ email: normalizedEmail });
        if (exists) {
            return res.status(400).json({ message: "User already registered. Please log in." });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashed
        });

        sendTokenResponse(user, 201, res, "Signup successful");
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Email already in use." });
        }
        res.status(500).json({ message: "Server error", error: err.message });
    }
}

// --- STANDARD LOGIN CONTROLLER ---
export async function login(req, res) {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user || !user.password) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

        sendTokenResponse(user, 200, res, "Login successful");
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
}

// --- GET CURRENT USER (Session Check) ---
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture || (DEFAULT_AVATAR + encodeURIComponent(user.name))
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during session check" });
    }
};

// --- LOGOUT ---
export async function logout(req, res) {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error during logout" });
    }
}

// --- GET ALL STUDENTS ---
export async function getAllStudents(req, res) {
    try {
        const students = await User.find({}, "name email profilePicture");
        const studentsWithAvatars = students.map(s => ({
            ...s._doc,
            profilePicture: s.profilePicture || (DEFAULT_AVATAR + encodeURIComponent(s.name))
        }));
        res.status(200).json(studentsWithAvatars);
    } catch (err) {
        res.status(500).json({ message: "Error fetching students", error: err.message });
    }
}