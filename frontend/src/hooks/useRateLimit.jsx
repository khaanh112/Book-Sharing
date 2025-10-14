import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook để theo dõi rate limit status
 */
export const useRateLimit = () => {
  const [rateLimitInfo, setRateLimitInfo] = useState({
    remaining: null,
    limit: null,
    reset: null,
    isLimited: false,
    waitTime: 0,
  });

  const [isWaiting, setIsWaiting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Xử lý rate limit info từ response headers
  const handleRateLimit = useCallback((event) => {
    const { remaining, reset, limit } = event.detail;
    setRateLimitInfo({
      remaining: Number(remaining),
      limit: Number(limit),
      reset,
      isLimited: remaining <= 0,
      waitTime: reset ? Math.max(0, reset - Date.now()) : 0,
    });
  }, []);

  // Xử lý khi đang chờ rate limit reset
  const handleRateLimitWaiting = useCallback((event) => {
    const { waitTime, resetTime } = event.detail;
    setIsWaiting(true);
    setCountdown(Math.ceil(waitTime / 1000));

    // Countdown timer
    const interval = setInterval(() => {
      const remaining = Math.ceil((resetTime - Date.now()) / 1000);
      if (remaining <= 0) {
        setIsWaiting(false);
        setCountdown(0);
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Xử lý khi vượt quá giới hạn retry
  const handleRateLimitExceeded = useCallback((event) => {
    const { message, retryAfter } = event.detail;
    setRateLimitInfo(prev => ({
      ...prev,
      isLimited: true,
      waitTime: retryAfter || 0,
    }));
    
    // Hiển thị thông báo (có thể dùng toast library)
    console.error(message);
  }, []);

  useEffect(() => {
    window.addEventListener('rateLimit', handleRateLimit);
    window.addEventListener('rateLimitWaiting', handleRateLimitWaiting);
    window.addEventListener('rateLimitExceeded', handleRateLimitExceeded);

    return () => {
      window.removeEventListener('rateLimit', handleRateLimit);
      window.removeEventListener('rateLimitWaiting', handleRateLimitWaiting);
      window.removeEventListener('rateLimitExceeded', handleRateLimitExceeded);
    };
  }, [handleRateLimit, handleRateLimitWaiting, handleRateLimitExceeded]);

  return {
    ...rateLimitInfo,
    isWaiting,
    countdown,
  };
};
