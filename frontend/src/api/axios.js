// src/api/axios.js
import axios from "axios";
import { toast } from 'react-toastify';

// Tạo instance axios
const API = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, // gửi cookie kèm request
});

// Biến kiểm soát refresh token
let isRefreshing = false;
let failedQueue = [];

// Biến kiểm soát rate limit
let rateLimitResetTime = null;
let rateLimitQueue = [];

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

// Hàm xử lý rate limit queue
const processRateLimitQueue = () => {
  const now = Date.now();
  if (rateLimitResetTime && now < rateLimitResetTime) {
    return; // Chưa đến thời gian reset
  }
  
  rateLimitResetTime = null;
  const queue = [...rateLimitQueue];
  rateLimitQueue = [];
  
  queue.forEach(({ resolve, originalRequest }) => {
    resolve(API(originalRequest));
  });
};

// Hàm sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm tính thời gian chờ từ header
const getRetryDelay = (error) => {
  const retryAfter = error.response?.headers['retry-after'];
  const rateLimitReset = error.response?.headers['ratelimit-reset'];
  
  if (retryAfter) {
    const asNumber = Number(retryAfter);
    if (!isNaN(asNumber)) {
      return asNumber * 1000; // Convert to milliseconds
    }
    const retryDate = Date.parse(retryAfter);
    if (!isNaN(retryDate)) {
      return Math.max(0, retryDate - Date.now());
    }
  }
  
  if (rateLimitReset) {
    const resetTime = Number(rateLimitReset) * 1000; // Unix timestamp to ms
    return Math.max(0, resetTime - Date.now());
  }
  
  return null;
};

// Interceptor response
API.interceptors.response.use(
  (response) => {
    // Lưu thông tin rate limit từ headers (nếu có)
    const remaining = response.headers['ratelimit-remaining'];
    const reset = response.headers['ratelimit-reset'];
    
    if (remaining !== undefined) {
      // Có thể dispatch event để UI component lắng nghe
      window.dispatchEvent(new CustomEvent('rateLimit', {
        detail: {
          remaining: Number(remaining),
          reset: Number(reset) * 1000,
          limit: response.headers['ratelimit-limit']
        }
      }));
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Xử lý 429 - Too Many Requests
    if (error.response?.status === 429) {
      const retryDelay = getRetryDelay(error);
      const maxRetries = originalRequest._rateLimitRetries || 0;
      
      // Giới hạn số lần retry cho rate limit
      if (maxRetries >= 3) {
        // Show error toast
        toast.error('⚠️ Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.', {
          position: "top-right",
          autoClose: 5000,
        });
        
        // Dispatch event để hiển thị thông báo lỗi
        window.dispatchEvent(new CustomEvent('rateLimitExceeded', {
          detail: {
            message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
            retryAfter: retryDelay
          }
        }));
        return Promise.reject(error);
      }
      
      originalRequest._rateLimitRetries = maxRetries + 1;
      
      if (retryDelay) {
        rateLimitResetTime = Date.now() + retryDelay;
        
        // Show waiting toast với countdown
        const seconds = Math.ceil(retryDelay / 1000);
        toast.warning(`⏳ Đang chờ... Vui lòng đợi ${seconds} giây.`, {
          position: "top-right",
          autoClose: retryDelay,
          hideProgressBar: false,
        });
        
        // Dispatch event để UI hiển thị countdown
        window.dispatchEvent(new CustomEvent('rateLimitWaiting', {
          detail: {
            waitTime: retryDelay,
            resetTime: rateLimitResetTime
          }
        }));
        
        // Đợi và retry
        await sleep(retryDelay);
        processRateLimitQueue();
        return API(originalRequest);
      } else {
        // Exponential backoff với jitter nếu không có Retry-After
        const baseDelay = 500;
        const exponentialDelay = Math.pow(2, maxRetries) * baseDelay;
        const jitter = Math.random() * 300;
        const waitTime = Math.min(30000, exponentialDelay + jitter);
        
        await sleep(waitTime);
        return API(originalRequest);
      }
    }

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
