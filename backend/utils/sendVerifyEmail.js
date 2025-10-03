import nodemailer from "nodemailer";

export const sendVerifyEmail = async (email, token, userData) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Mã hóa thông tin user
  const userInfo = Buffer.from(JSON.stringify(userData)).toString("base64");
  const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}&user=${userInfo}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your email",
    html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`
  });
};