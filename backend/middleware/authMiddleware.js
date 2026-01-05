import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  try {
    let token;

    // 1. Check Authorization header (Standard API calls)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } 
    // 2. Check HTTP-only cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 3. 🔥 THE DOWNLOAD FIX: Check query parameters
    // This allows the direct link from MaterialsContext.js to work
    else if (req.query && req.query.token) {
      token = req.query.token;
    }

    // If no token found in any source
    if (!token) {
      return res.status(401).json({ message: "Authentication required. No token provided." });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request
    req.user = { id: decoded.id };
    
    next();
  } catch (err) {
    console.error("Authentication Error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}