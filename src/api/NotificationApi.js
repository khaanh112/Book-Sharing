import axiosInstance from './axios';

const NotificationApi = {
  // Get all notifications
  getAllNotifications: async (unreadOnly = false) => {
    const url = unreadOnly ? '/notifications?unreadOnly=true' : '/notifications';
    const response = await axiosInstance.get(url);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await axiosInstance.get('/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await axiosInstance.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await axiosInstance.put('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await axiosInstance.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Delete all read notifications
  deleteAllRead: async () => {
    const response = await axiosInstance.delete('/notifications/read');
    return response.data;
  }
};

export default NotificationApi;