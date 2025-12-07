// shared/events/EventTypes.js
/**
 * Event Type Constants
 * Centralized event names for type safety and consistency
 */

const EventTypes = {
  // Book events
  BOOK_CREATED: 'book.created',
  BOOK_UPDATED: 'book.updated',
  BOOK_DELETED: 'book.deleted',
  
  // Borrow events
  BORROW_CREATED: 'borrow.created',
  BORROW_APPROVED: 'borrow.approved',
  BORROW_REJECTED: 'borrow.rejected',
  BORROW_RETURNED: 'borrow.returned',
  BORROW_CANCELLED: 'borrow.cancelled',
  
  // User events
  USER_REGISTERED: 'user.registered',
  USER_VERIFIED: 'user.verified',
  USER_UPDATED: 'user.updated',
  
  // Notification events
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read'
};

export default EventTypes;
