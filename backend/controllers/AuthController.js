import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user=await User.create({ name, email, password: hashed });
    const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{
      expiresIn:"7d",
    });

    res.status(201).json({ message: "Signup successful" ,token});
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

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}
export const getMe = async (req, res) => {
    try {
        // Find the user using the ID provided by authMiddleware
        // .select('-password') prevents sending the hashed password to the client
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return the user data to the frontend
        res.status(200).json({ 
            id: user._id, 
            username: user.username, 
            email: user.email,
        });

    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Server error during session check" });
    }
};

export async function getAllStudents(req, res) {
  try {
    // We only fetch name, email, and picture for safety
    // We do NOT fetch passwords
    const students = await User.find({}, "name email picture");
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Error fetching students", error: err.message });
  }
}
