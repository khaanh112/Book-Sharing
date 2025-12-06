// modules/notifications/domain/NotificationService.js
import eventBus from '../../../shared/events/EventBus.js';
import EventTypes from '../../../shared/events/EventTypes.js';

class NotificationService {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  /**
   * Create a new notification
   */
  async createNotification(notificationData) {
    const notification = await this.notificationRepository.create(notificationData);
    
    // Emit event
    eventBus.emit(EventTypes.NOTIFICATION_CREATED, {
      notificationId: notification._id,
      userId: notification.userId,
      type: notification.type
    });
    
    return notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await this.notificationRepository.markAsRead(notificationId, userId);
    
    if (notification) {
      eventBus.emit(EventTypes.NOTIFICATION_READ, {
        notificationId: notification._id,
        userId: notification.userId
      });
    }
    
    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    const result = await this.notificationRepository.markAllAsRead(userId);
    
    eventBus.emit(EventTypes.NOTIFICATION_ALL_READ, {
      userId,
      count: result.modifiedCount
    });
    
    return result;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options = {}) {
    return await this.notificationRepository.findByUser(userId, options);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    const notification = await this.notificationRepository.delete(notificationId, userId);
    
    if (notification) {
      eventBus.emit(EventTypes.NOTIFICATION_DELETED, {
        notificationId,
        userId
      });
    }
    
    return notification;
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    return await this.notificationRepository.countUnread(userId);
  }
}

export default NotificationService;
