import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Helper to provide a default avatar if none exists
const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=random&color=fff&name=";

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

    // We send the user object with the token so frontend can use it immediately
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
      name: user.name, // Changed from username to name to match your Schema
      email: user.email,
      // 🔥 FIX: Return profilePicture or a default one
      profilePicture: user.profilePicture || (DEFAULT_AVATAR + user.name)
    });

  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error during session check" });
  }
};

export async function getAllStudents(req, res) {
  try {
    // 🔥 FIX: Changed 'picture' to 'profilePicture' to match your Schema
    const students = await User.find({}, "name email profilePicture");
    
    // Map through students to add default avatars where missing
    const studentsWithAvatars = students.map(s => ({
      ...s._doc,
      profilePicture: s.profilePicture || (DEFAULT_AVATAR + s.name)
    }));

    res.status(200).json(studentsWithAvatars);
  } catch (err) {
    res.status(500).json({ message: "Error fetching students", error: err.message });
  }
}