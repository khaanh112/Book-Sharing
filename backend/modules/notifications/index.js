// modules/notifications/index.js
import NotificationService from './domain/NotificationService.js';
import NotificationRepository from './infrastructure/NotificationRepository.js';
import notificationRoutes from './interface/NotificationRoutes.js';

// Initialize repository and service
const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);

// Event types this module publishes
const NotificationEvents = {
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',
  NOTIFICATION_ALL_READ: 'notification.allRead',
  NOTIFICATION_DELETED: 'notification.deleted'
};

export {
  notificationService,
  notificationRepository,
  notificationRoutes,
  NotificationEvents
};

export default {
  service: notificationService,
  repository: notificationRepository,
  routes: notificationRoutes,
  events: NotificationEvents
};
