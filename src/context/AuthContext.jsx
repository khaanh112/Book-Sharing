import React, { createContext, useContext, useEffect, useState } from "react";
import authApi from "../api/AuthApi";
import UserApi from "../api/UserApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lấy thông tin user khi app khởi chạy
  useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await authApi.getCurrentUser();
      setUser(res.data || {}); // Ensure we always set an object
    } catch (err) {
      setUser({}); // Set empty object instead of null
    } finally {
      setLoading(false);
    }
  };
  checkAuth();
  }, []);

  // Login
  const login = async (credentials) => {
    await authApi.login(credentials); // backend set cookie
    const me = await authApi.getCurrentUser();
    setUser(me.data);
  };

  const updateProfile = async (formData) => {
  try {
    const res = await UserApi.updateProfile(formData);
    setUser(res.data.user || {}); // Ensure we always set an object
    return res;
  } catch (error) {
    setUser(prev => prev); // Maintain previous state on error
    throw error;
  }
  };

  const changePassword = async (formData) => {
    return await UserApi.changePassword(formData);
  };




  // Logout
  const logout = async () => {
  await authApi.logout();
  setUser({}); // Set empty object instead of null
  };

  const value = {
    user,
    setUser,
    login,
    logout,
    updateProfile,
    changePassword,
    loading,
    isAuthenticated: user && Object.keys(user).length > 0,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
