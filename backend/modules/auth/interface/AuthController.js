import User from "../../users/domain/User.model.js"; // Keep for User.create() only
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerifyEmail } from "../../../shared/utils/sendVerifyEmail.js";
import { generateAccessToken, generateRefreshToken } from "../../../shared/utils/jwt.js";
import { setAccessTokenCookie, setRefreshTokenCookie } from "../../../shared/utils/cookie.js";
import redisClient from "../../../shared/utils/redisClient.js"; // Redis client

// CQRS imports - Use QueryBus instead of direct User queries
import { queryBus } from '../../../cqrs/bootstrap.js';
import GetUserByEmailQuery from '../../users/application/queries/GetUserByEmailQuery.js';
import GetUserByIdQuery from '../../users/application/queries/GetUserByIdQuery.js';

// Register
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new Error("All fields are mandatory");
  }
  // Use CQRS Query instead of direct User.findOne
  const userAvailable = await queryBus.execute(new GetUserByEmailQuery(email));
  if (userAvailable) {
    res.status(400);
    throw new Error("This email is already registered!");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const verifyToken = crypto.randomBytes(32).toString("hex");

  // Gửi email xác thực, kèm thông tin user đã mã hóa
  await sendVerifyEmail(email, verifyToken, { name, email, passwordHash });

  res.status(200).json({ status: "success", message: "Please check your email to verify." });
};

// Verify Email
const verifyEmail = async (req, res) => {
  const { token, user } = req.query;
  if (!token || !user) {
    res.status(400);
    throw new Error("Invalid verification link");
  }
  const userData = JSON.parse(Buffer.from(user, "base64").toString("utf8"));

  // Use CQRS Query
  const userAvailable = await queryBus.execute(new GetUserByEmailQuery(userData.email));
  if (userAvailable) {
    res.status(400);
    throw new Error("User already registered by this email!");
  }

  const newUser = await User.create({
    name: userData.name,
    email: userData.email,
    passwordHash: userData.passwordHash,
  });

  res.status(200).json({ status: "success", message: "Email verified and account created!" });
};

// Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400);
    throw new Error("All fields are mandatory");
  }
  // Use CQRS Query
  const user = await queryBus.execute(new GetUserByEmailQuery(email));
  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({ accessToken });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
};

// Refresh Token
const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    res.status(401);
    throw new Error("Refresh token not found");
  }
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Use CQRS Query
    const user = await queryBus.execute(new GetUserByIdQuery(payload.user.id));
    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    const newAccessToken = generateAccessToken(user);
    setAccessTokenCookie(res, newAccessToken);
    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403);
    throw new Error("Invalid refresh token");
  }
};

// Get Current User
const currentUser = async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User not authenticated");
  }
  res.status(200).json(req.user);
};

// Logout với JWT blacklist (cookie)
const logoutUser = async (req, res) => {
  try {
    // Lấy token từ cookie
    const token = req.cookies.accessToken;

    // Xóa cookie
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");

    if (token) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        const ttl = decoded.exp - now; // thời gian còn lại
        if (ttl > 0) {
          // Lưu token vào Redis blacklist với TTL
          await redisClient.set(`jwt:blacklist:${token}`, "true", "EX", ttl);
        }
      }
    }

    res.status(200).json({ message: "User logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { registerUser, verifyEmail, loginUser, refreshToken, currentUser, logoutUser };
