import React, { createContext, useContext, useEffect, useState } from "react";
import authApi from "../api/AuthApi";
import UserApi from "../api/UserApi";

const AuthContext = createContext();

// Cache để tránh gọi API liên tục
let authCheckCache = {
  data: null,
  timestamp: 0,
  promise: null // Prevent duplicate requests
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lấy thông tin user khi app khởi chạy
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check cache first
        const now = Date.now();
        if (authCheckCache.data && (now - authCheckCache.timestamp) < CACHE_DURATION) {
          console.log("✅ Using cached auth data");
          setUser(authCheckCache.data);
          setLoading(false);
          return;
        }

        // If already fetching, wait for that request
        if (authCheckCache.promise) {
          console.log("⏳ Waiting for existing auth request");
          const userData = await authCheckCache.promise;
          setUser(userData);
          setLoading(false);
          return;
        }

        // Make new request
        console.log("🔍 Fetching fresh auth data");
        authCheckCache.promise = authApi.getCurrentUser()
          .then(res => {
            const userData = res.data || {};
            authCheckCache.data = userData;
            authCheckCache.timestamp = Date.now();
            authCheckCache.promise = null;
            return userData;
          })
          .catch(err => {
            authCheckCache.promise = null;
            return {};
          });

        const userData = await authCheckCache.promise;
        setUser(userData);
      } catch (err) {
        setUser({});
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []); // Empty dependency - chỉ chạy 1 lần

  // Login
  const login = async (credentials) => {
    await authApi.login(credentials); // backend set cookie
    const me = await authApi.getCurrentUser();
    const userData = me.data;
    setUser(userData);
    
    // Update cache
    authCheckCache.data = userData;
    authCheckCache.timestamp = Date.now();
  };

  const updateProfile = async (formData) => {
  try {
    const res = await UserApi.updateProfile(formData);
    const userData = res.data.user || {};
    setUser(userData);
    
    // Update cache
    authCheckCache.data = userData;
    authCheckCache.timestamp = Date.now();
    
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
    setUser({});
    
    // Clear cache
    authCheckCache.data = null;
    authCheckCache.timestamp = 0;
    authCheckCache.promise = null;
  };

  // Manual refresh user data (optional - for force refresh)
  const refreshUser = async () => {
    try {
      // Clear cache để force fetch mới
      authCheckCache.data = null;
      authCheckCache.timestamp = 0;
      
      const res = await authApi.getCurrentUser();
      const userData = res.data || {};
      setUser(userData);
      
      // Update cache
      authCheckCache.data = userData;
      authCheckCache.timestamp = Date.now();
      
      return userData;
    } catch (err) {
      setUser({});
      throw err;
    }
  };

  const value = {
    user,
    setUser,
    login,
    logout,
    updateProfile,
    changePassword,
    refreshUser, // Export để có thể force refresh nếu cần
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
