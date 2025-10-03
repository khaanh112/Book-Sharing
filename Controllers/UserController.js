import User from "../models/User.js";
import bcrypt from "bcrypt";


const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Old and new password are required" });
  }

  const user = await User.findById(req.user.id);

  if (!user || !user.passwordHash) {
    return res.status(400).json({ message: "User not found or no password set" });
  }

  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ message: "Old password is incorrect" });
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.status(200).json({ message: "Password updated successfully" });
};

const updateUser = async (req, res) => {
  try {
    const { name } = req.body;
    const updateData = {};

    if (name) updateData.name = name;

    if (req.file) {
      updateData.avatar = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        // avatar có thể trả riêng URL hoặc không trả base64 nữa để giảm payload
      }
    });

  } catch (err) {
    console.error("❌ Lỗi updateUser:", err);
    res.status(500).json({ message: "Server error updating user" });
  }
}; 

export { changePassword, updateUser };