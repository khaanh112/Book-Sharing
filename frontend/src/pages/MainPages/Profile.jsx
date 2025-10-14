import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { showSuccess, showError } from "../../utils/toastUtils";

export default function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();

  // Form state
  const [newName, setNewName] = useState(user?.name || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">You need to log in to view profile.</p>
      </div>
    );
  }

  // Update name
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (newName === user.name) return; // không có thay đổi
    setLoading(true);

    try {
      const updatedUser = await updateProfile({ name: newName });
      showSuccess("Profile updated successfully! 👤");
      setNewName(updatedUser.name); // cập nhật lại name sau khi đổi
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to update profile";
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await changePassword({ oldPassword, newPassword });
      showSuccess("Password changed successfully! 🔒");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to change password";
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-center max-h-screen bg-pink-50 px-4 pt-0">
      <div className="w-full max-w-7xl p-4 bg-white shadow-xl rounded-2xl flex flex-col md:flex-row gap-5">
        {/* Left: Info & Logout */}
        <div className="flex flex-col items-center md:items-start gap-4 md:w-1/3">
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-gray-600">{user.email}</p>

          <button
            onClick={logout}
            className="mt-4 px-6 py-2 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Right: Forms */}
        <div className="flex-1 space-y-8">
          {/* Update Name */}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <h2 className="text-xl font-semibold text-pink-600">Update Name</h2>
            <input
              type="text"
              placeholder="New Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-300 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || newName === user.name}
              className="w-full px-4 py-3 bg-green-400 text-white font-semibold rounded-lg hover:bg-green-500 transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Name"}
            </button>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h2 className="text-xl font-semibold text-pink-600">Change Password</h2>
            <input
              type="password"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-300 focus:outline-none"
              required
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-300 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-400 text-white font-semibold rounded-lg hover:bg-blue-500 transition disabled:opacity-50"
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
