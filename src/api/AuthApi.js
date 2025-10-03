// src/api/AuthApi.js
import API from "./axios";

const authApi = {
  register: (data) => API.post("/auth/register", data),
  verifyEmail: (token, user) => API.get(`/auth/verify-email?token=${token}&user=${user}`),
  login: (data) => API.post("/auth/login", data),
  logout: () => API.get("/auth/logout"),
  getCurrentUser: () => API.get("/auth/current")
};

export default authApi;
