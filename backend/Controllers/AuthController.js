import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerifyEmail } from "../utils/sendVerifyEmail.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { setAccessTokenCookie, setRefreshTokenCookie } from "../utils/cookie.js";





// Register
const registerUser = async (req, res) => {


  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new Error("All fields are mandatory");
  }
  const userAvailable = await User.findOne({ email });
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

const verifyEmail = async (req, res) => {
  const { token, user } = req.query;
  if (!token || !user) {
    res.status(400);
    throw new Error("Invalid verification link");
  }
  // Giải mã thông tin user
  const userData = JSON.parse(Buffer.from(user, "base64").toString("utf8"));

  // Kiểm tra lại email đã tồn tại chưa
  const userAvailable = await User.findOne({ email: userData.email });
  if (userAvailable) {
    res.status(400);
    throw new Error("User already registered by this email!");
   }

  // Lưu user vào DB, đã xác thực
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
  const user = await User.findOne({ email });
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

    const user = await User.findById(payload.user.id);
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


// Logout
const logoutUser = async (req, res) => {
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  res.status(200).json({ message: "User logged out successfully" });
};




export { registerUser, verifyEmail, loginUser, refreshToken, currentUser, logoutUser,  };