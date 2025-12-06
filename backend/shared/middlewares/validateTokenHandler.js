import User from "../../modules/users/domain/User.model.js";
import jwt from "jsonwebtoken";
import redisClient from "../utils/redisClient.js";

const validateToken = async (req, res, next) => {
  try {
    // Lấy token từ cookie hoặc header
    const authHeader = req.headers.authorization;
    const token =
      req.cookies.accessToken ||
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Kiểm tra token có bị blacklist không (đã logout)
    const isBlacklisted = await redisClient.get(`jwt:blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ message: "Token has been logged out" });
    }

    // Xác thực token
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Tìm user trong DB
    const user = await User.findById(payload.user.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Gán user vào request để route khác sử dụng
    req.user = user;
    next();
  } catch (err) {
    console.error("JWT validation error:", err.message);
    res.status(403).json({ message: "Invalid token" });
  }
};

export default validateToken;
