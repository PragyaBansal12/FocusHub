// middleware/authMiddleware.js - FINAL CORRECTED VERSION

import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
try {
 
 // 1. Attempt to get token from Authorization header (Standard approach)
 const authHeader = req.headers.authorization;
 let token;

 if (authHeader && authHeader.startsWith("Bearer ")) {
  token = authHeader.split(" ")[1];
 } else if (req.cookies.token) {
   // 2. 🔥 CRITICAL FIX: Fallback to token from HTTP-only cookie
  token = req.cookies.token;
 }
 
 // If neither source provided a token, return unauthorized
 if (!token) {
  return res.status(401).json({ message: "No token provided" });
 }
 
 
 // 3. Verify the token (regardless of where it came from)
 const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
 // Attach user ID to the request
 req.user = { id: decoded.id };
  
 next(); 
} catch (err) {
 // Log the error for server-side debugging (e.g., token expired)
  console.error("Authentication Error:", err.message); 
  res.status(401).json({ message: "Invalid or expired token" });
}
}