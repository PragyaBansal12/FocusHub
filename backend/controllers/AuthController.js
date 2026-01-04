import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from 'google-auth-library'; // 🔥 Added this

// Initialize Google Client
const client = new OAuth2Client(process.env.GOOGLE_LOGIN_CLIENT_ID);

// Helper to provide a default avatar if none exists
const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=random&color=fff&name=";

// 🔥 NEW: Google Login Controller
// 🔥 NEW: Google Login Controller (With Cookie Support for Consistency)
export async function googleLogin(req, res) {
  const { token } = req.body;

  try {
    // 1. Verify the Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_LOGIN_CLIENT_ID,
    });
    
    const { name, email, picture, sub } = ticket.getPayload();

    // 2. Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // 3. Create new user if they don't exist
      user = await User.create({
        name,
        email,
        profilePicture: picture,
        googleId: sub,
      });
    }

    // 4. Generate your app's JWT
    const appToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // 5. 🔥 CRITICAL FIX: Set the HTTP-only cookie for authMiddleware
    res.cookie("token", appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 6. Respond with the user object and token
    res.json({ 
      message: "Google login successful", 
      token: appToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || (DEFAULT_AVATAR + user.name)
      }
    });
    
  } catch (error) {
    console.error("Google Verification Error:", error);
    res.status(400).json({ message: "Google verification failed", error: error.message });
  }
}

// --- YOUR EXISTING LOGIC (UNTOUCHED) ---

export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ message: "Signup successful", token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ 
      message: "Login successful", 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || (DEFAULT_AVATAR + user.name)
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      id: user._id, 
      name: user.name, 
      email: user.email,
      profilePicture: user.profilePicture || (DEFAULT_AVATAR + user.name)
    });

  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error during session check" });
  }
};

export async function getAllStudents(req, res) {
  try {
    const students = await User.find({}, "name email profilePicture");
    
    const studentsWithAvatars = students.map(s => ({
      ...s._doc,
      profilePicture: s.profilePicture || (DEFAULT_AVATAR + s.name)
    }));

    res.status(200).json(studentsWithAvatars);
  } catch (err) {
    res.status(500).json({ message: "Error fetching students", error: err.message });
  }
}