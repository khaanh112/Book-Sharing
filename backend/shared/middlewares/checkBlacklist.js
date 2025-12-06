import redisClient from "../utils/redisClient.js"; // import client Redis đã tạo
import jwt from "jsonwebtoken";

const checkBlacklist = async (req, res, next) => {
  try {
    // 1. Lấy token từ header Authorization
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    // 2. Kiểm tra token có trong Redis blacklist không
    const isBlacklisted = await redisClient.get(`jwt:blacklist:${token}`);
    if (isBlacklisted) {
      // 3. Nếu token bị blacklist → trả 401 Unauthorized
      return res.status(401).json({ message: "Token has been logged out" });
    }

    // 4. Nếu không bị blacklist → tiếp tục
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default checkBlacklist;
