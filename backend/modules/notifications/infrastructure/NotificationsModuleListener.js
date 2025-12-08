// modules/notifications/infrastructure/NotificationsModuleListener.js
import eventBus from '../../../shared/events/EventBus.js';
import Notification from '../domain/Notification.model.js';

/**
 * NotificationsModuleListener - Handles incoming event requests for Notifications module
 * TRUE EVENT-DRIVEN: Module listens to requests and responds via events
 */

// ===== CREATE NOTIFICATION REQUEST =====
eventBus.on('notification.create.request', async (data) => {
  try {
    const notification = await Notification.create({
      userId: data.userId,
      type: data.type,
      message: data.message,
      relatedId: data.relatedId,
      relatedModel: data.relatedModel,
      title: data.title || data.type,
      bookTitle: data.bookTitle,
      senderName: data.senderName
    });
    
    console.log(` Notification created: ${notification._id}`);
  } catch (error) {
    console.error(' Notifications module: Create notification failed:', error.message);
  }
});

// ===== CLEANUP NOTIFICATIONS (for cascade delete) =====
eventBus.on('notification.cleanup.request', async (data) => {
  try {
    const query = {};
    
    if (data.userId) {
      query.userId = data.userId;
    }
    
    if (data.relatedId && data.relatedModel) {
      query.relatedId = data.relatedId;
      query.relatedModel = data.relatedModel;
    }
    
    const result = await Notification.deleteMany(query);
    
    console.log(` Notifications module: Deleted ${result.deletedCount} notifications`);
  } catch (error) {
    console.error(' Notifications module: Cleanup failed:', error.message);
  }
});

console.log(' NotificationsModuleListener registered');
