import jwt from "jsonwebtoken";

// Generate Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    { user: { id: user.id, name: user.name, email: user.email } },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { user: { id: user.id } },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

export { generateAccessToken, generateRefreshToken };