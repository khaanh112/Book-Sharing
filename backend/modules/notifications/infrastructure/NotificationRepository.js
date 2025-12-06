// modules/notifications/infrastructure/NotificationRepository.js
import Notification from '../domain/Notification.model.js';

class NotificationRepository {
  /**
   * Create a new notification
   */
  async create(notificationData) {
    const notification = new Notification(notificationData);
    return await notification.save();
  }

  /**
   * Find notification by ID
   */
  async findById(notificationId) {
    return await Notification.findById(notificationId).lean();
  }

  /**
   * Find notifications by user
   */
  async findByUser(userId, options = {}) {
    const { page = 1, limit = 20, isRead } = options;
    const skip = (page - 1) * limit;

    const query = { userId };
    if (isRead !== undefined) {
      query.isRead = isRead;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  /**
   * Delete notification
   */
  async delete(notificationId, userId) {
    return await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });
  }

  /**
   * Count unread notifications
   */
  async countUnread(userId) {
    return await Notification.countDocuments({
      userId,
      isRead: false
    });
  }

  /**
   * Delete old read notifications (cleanup)
   */
  async deleteOldRead(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await Notification.deleteMany({
      isRead: true,
      createdAt: { $lt: cutoffDate }
    });
  }
}

export default NotificationRepository;
