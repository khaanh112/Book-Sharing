import Notification from '../models/Notificaion.js';
import cache from '../utils/cache.js';

/**
 * Lấy tất cả notifications của user
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unreadOnly } = req.query;

    const filter = { userId };
    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const cacheKey = `notifications:list:${userId}:${unreadOnly === 'true' ? 'unread' : 'all'}`;
    const notifications = await cache.getOrSetJSON(cacheKey, 10, async () => {
      return await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    });

    const unreadCountKey = `notifications:unread:${userId}`;
    let unreadCount = await cache.getJSON(unreadCountKey);
    if (unreadCount === null) {
      unreadCount = await Notification.countDocuments({ userId, read: false });
      await cache.setJSON(unreadCountKey, unreadCount, 10);
    }

    res.status(200).json({
      status: 'success',
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get notifications'
    });
  }
};

/**
 * Đánh dấu notification đã đọc
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    // Invalidate related notification caches
    await cache.del(`notifications:list:${userId}:all`);
    await cache.del(`notifications:list:${userId}:unread`);
    await cache.del(`notifications:unread:${userId}`);

    res.status(200).json({
      status: 'success',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read'
    });
  }
};

/**
 * Đánh dấu tất cả notifications đã đọc
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    // Invalidate related notification caches
    await cache.del(`notifications:list:${userId}:all`);
    await cache.del(`notifications:list:${userId}:unread`);
    await cache.del(`notifications:unread:${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all as read'
    });
  }
};

/**
 * Xóa notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    // Invalidate related notification caches
    await cache.del(`notifications:list:${userId}:all`);
    await cache.del(`notifications:list:${userId}:unread`);
    await cache.del(`notifications:unread:${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification'
    });
  }
};

/**
 * Xóa tất cả notifications đã đọc
 */
const deleteReadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.deleteMany({ userId, read: true });

    // Invalidate related notification caches
    await cache.del(`notifications:list:${userId}:all`);
    await cache.del(`notifications:list:${userId}:unread`);
    await cache.del(`notifications:unread:${userId}`);

    res.status(200).json({
      status: 'success',
      message: `${result.deletedCount} notifications deleted`
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete notifications'
    });
  }
};

/**
 * Lấy số lượng notifications chưa đọc
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const key = `notifications:unread:${userId}`;
    let count = await cache.getJSON(key);
    if (count === null) {
      count = await Notification.countDocuments({ userId, read: false });
      await cache.setJSON(key, count, 10);
    }

    res.status(200).json({
      status: 'success',
      unreadCount: count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get unread count'
    });
  }
};

export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getUnreadCount
};
