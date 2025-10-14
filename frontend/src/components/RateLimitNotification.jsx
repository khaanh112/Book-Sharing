import { useEffect } from 'react';
import { useRateLimit } from '../hooks/useRateLimit';
import { toast } from 'react-toastify';

/**
 * Component này giờ chỉ để show rate limit info counter (optional)
 * Toast notifications được handle trong axios interceptor
 */
const RateLimitNotification = () => {
  const { remaining, limit, isLimited } = useRateLimit();

  // Optional: Show persistent warning khi gần hết limit
  useEffect(() => {
    if (remaining !== null && remaining <= 10 && remaining > 0) {
      toast.info(`⚠️ Còn ${remaining} requests. Hãy giảm tốc độ!`, {
        position: "bottom-right",
        autoClose: 3000,
        toastId: 'rate-limit-warning', // Prevent duplicate
      });
    }
  }, [remaining]);

  // Optional: Hiển thị rate limit counter ở góc màn hình
  if (remaining === null || limit === null) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 px-4 py-2 bg-blue-50 border border-blue-300 rounded-md shadow-md text-sm text-blue-900 z-[9999]">
      Requests còn lại:{' '}
      <span className={`font-semibold ${remaining <= 10 ? 'text-red-600' : ''}`}>
        {remaining}/{limit}
      </span>
    </div>
  );
};

export default RateLimitNotification;
