import React, { createContext, useContext, useState, useEffect } from 'react';
import NotificationApi from '../api/NotificationApi';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

// Cache for unread count - prevent excessive API calls
let unreadCountCache = {
  count: 0,
  timestamp: 0,
  promise: null
};

const CACHE_DURATION = 30 * 1000; // 30 seconds (match polling interval)

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch unread count with caching
  const fetchUnreadCount = async (forceRefresh = false) => {
    try {
      if (!user?._id) return;

      // Check cache first (unless force refresh)
      const now = Date.now();
      if (!forceRefresh && unreadCountCache.count !== null && (now - unreadCountCache.timestamp) < CACHE_DURATION) {
        console.log('📊 Using cached unread count:', unreadCountCache.count);
        setUnreadCount(unreadCountCache.count);
        return;
      }

      // If already fetching, wait for that request
      if (unreadCountCache.promise) {
        console.log('⏳ Waiting for existing unread count request');
        const data = await unreadCountCache.promise;
        setUnreadCount(data.unreadCount || 0);
        return;
      }

      // Fetch fresh data
      console.log('🔍 Fetching fresh unread count');
      const fetchPromise = NotificationApi.getUnreadCount();
      unreadCountCache.promise = fetchPromise;

      const data = await fetchPromise;
      const count = data.unreadCount || 0;
      
      // Update cache
      unreadCountCache.count = count;
      unreadCountCache.timestamp = Date.now();
      unreadCountCache.promise = null;
      
      setUnreadCount(count);
    } catch (err) {
      unreadCountCache.promise = null;
      console.error('Error fetching unread count:', err);
    }
  };

  // Fetch all notifications
  const fetchNotifications = async (unreadOnly = false) => {
    try {
      if (!user?._id) return;
      setLoading(true);
      const data = await NotificationApi.getAllNotifications(unreadOnly);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await NotificationApi.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      
      // Update unread count and cache
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);
      unreadCountCache.count = newCount;
      unreadCountCache.timestamp = Date.now();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await NotificationApi.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      // Update unread count and cache
      setUnreadCount(0);
      unreadCountCache.count = 0;
      unreadCountCache.timestamp = Date.now();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await NotificationApi.deleteNotification(notificationId);
      
      // Remove from local state
      const deletedNotif = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      // Update unread count if deleted notification was unread
      if (deletedNotif && !deletedNotif.read) {
        const newCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newCount);
        unreadCountCache.count = newCount;
        unreadCountCache.timestamp = Date.now();
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Delete all read notifications
  const deleteAllRead = async () => {
    try {
      await NotificationApi.deleteAllRead();
      
      // Keep only unread notifications
      setNotifications(prev => prev.filter(notif => !notif.read));
      // Unread count stays the same, just update cache timestamp
      unreadCountCache.timestamp = Date.now();
    } catch (err) {
      console.error('Error deleting read notifications:', err);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
      borrow_request_new: '📚',
      borrow_request_accepted: '✅',
      borrow_request_rejected: '❌',
      borrow_due_soon: '⏰',
      borrow_overdue: '🚨',
      book_returned: '📖'
    };
    return icons[type] || '🔔';
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!user?._id) {
      // Clear cache when no user
      unreadCountCache.count = 0;
      unreadCountCache.timestamp = 0;
      unreadCountCache.promise = null;
      return;
    }

    // Initial fetch (will use cache if available)
    fetchUnreadCount();
    
    // Poll every 30 seconds (cache prevents duplicate requests)
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?._id]); // Only depend on user ID to prevent unnecessary re-runs

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    getNotificationIcon,
    // Force refresh (bypass cache)
    refreshUnreadCount: () => fetchUnreadCount(true)
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};