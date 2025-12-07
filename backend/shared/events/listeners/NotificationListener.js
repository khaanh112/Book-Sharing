// shared/events/listeners/NotificationListener.js
import eventBus from '../EventBus.js';
import EventTypes from '../EventTypes.js';
import Notification from '../../../modules/notifications/domain/Notification.model.js';

/**
 * NotificationListener - Creates notifications in background
 * Listens to domain events and creates appropriate notifications
 */

// Listen for borrow.created
eventBus.on(EventTypes.BORROW_CREATED, async (data) => {
  try {
    await Notification.create({
      userId: data.ownerId,
      type: 'BORROW_REQUEST',
      message: `Someone wants to borrow your book`,
      relatedId: data.borrowId,
      relatedType: 'Borrow'
    });
    console.log('✅ Notification created for borrow.created');
  } catch (error) {
    console.error('❌ Notification failed for borrow.created:', error.message);
  }
});

// Listen for borrow.approved
eventBus.on(EventTypes.BORROW_APPROVED, async (data) => {
  try {
    await Notification.create({
      userId: data.borrowerId,
      type: 'BORROW_APPROVED',
      message: `Your borrow request was approved!`,
      relatedId: data.borrowId,
      relatedType: 'Borrow'
    });
    console.log('✅ Notification created for borrow.approved');
  } catch (error) {
    console.error('❌ Notification failed for borrow.approved:', error.message);
  }
});

// Listen for borrow.rejected
eventBus.on(EventTypes.BORROW_REJECTED, async (data) => {
  try {
    await Notification.create({
      userId: data.borrowerId,
      type: 'BORROW_REJECTED',
      message: `Your borrow request was rejected${data.reason ? ': ' + data.reason : ''}`,
      relatedId: data.borrowId,
      relatedType: 'Borrow'
    });
    console.log('✅ Notification created for borrow.rejected');
  } catch (error) {
    console.error('❌ Notification failed for borrow.rejected:', error.message);
  }
});

// Listen for borrow.returned
eventBus.on(EventTypes.BORROW_RETURNED, async (data) => {
  try {
    await Notification.create({
      userId: data.ownerId,
      type: 'BOOK_RETURNED',
      message: `Your book has been returned`,
      relatedId: data.borrowId,
      relatedType: 'Borrow'
    });
    console.log('✅ Notification created for borrow.returned');
  } catch (error) {
    console.error('❌ Notification failed for borrow.returned:', error.message);
  }
});

// Listen for borrow.cancelled
eventBus.on(EventTypes.BORROW_CANCELLED, async (data) => {
  try {
    await Notification.create({
      userId: data.ownerId,
      type: 'BORROW_CANCELLED',
      message: `A borrow request was cancelled`,
      relatedId: data.borrowId,
      relatedType: 'Borrow'
    });
    console.log('✅ Notification created for borrow.cancelled');
  } catch (error) {
    console.error('❌ Notification failed for borrow.cancelled:', error.message);
  }
});

console.log('👂 NotificationListener registered for borrow events');
