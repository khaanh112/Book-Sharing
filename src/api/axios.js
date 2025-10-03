// src/api/axios.js
import axios from "axios";

// Tạo instance axios
const API = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, // gửi cookie kèm request
});

// Biến kiểm soát refresh token
let isRefreshing = false;
let failedQueue = [];

// Hàm xử lý queue
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor response
API.interceptors.response.use(
  (response) => response, // Thành công thì trả về luôn
  async (error) => {
    const originalRequest = error.config;

    // Nếu request bị 401 và không phải refresh-token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh-token") 
    ) {
      if (isRefreshing) {
        // Nếu đang refresh → đẩy vào queue chờ
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => API(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      // Đánh dấu đã retry
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi refresh token
        await API.get("/auth/refresh-token");

        // Xử lý queue (cho các request đang đợi)
        processQueue(null);
        return API(originalRequest); // Retry request ban đầu
      } catch (err) {
        processQueue(err, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
