// middleware validateToken.js
import User from "../models/User.js";
import jwt from "jsonwebtoken";


const validateToken = async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // Lấy full user từ DB
    const user = await User.findById(payload.user.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user; 
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};

export default validateToken;
