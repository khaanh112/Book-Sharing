// shared/events/listeners/CascadeCleanupListener.js
import eventBus from '../EventBus.js';
import EventTypes from '../EventTypes.js';

/**
 * CascadeCleanupListener - Handles cascade operations via events
 * TRUE EVENT-DRIVEN: No direct model imports, all via events
 */

// ===== BOOK DELETE VALIDATION =====
// Respond to book deletion validation requests from Books module
eventBus.on('book.delete.validation.request', async (data) => {
  try {
    console.log('🔍 Validating book deletion:', data.bookId);
    
    // Emit request to Borrowing module to check active borrows
    eventBus.emit('borrow.check.active.request', {
      bookId: data.bookId,
      responseEvent: 'book.delete.validation.response'
    });
  } catch (error) {
    console.error('❌ Book delete validation failed:', error.message);
    eventBus.emit('book.delete.validation.response', {
      bookId: data.bookId,
      error: 'Validation check failed'
    });
  }
});

// ===== BOOK DELETED CASCADE =====
eventBus.on(EventTypes.BOOK_DELETED, async (data) => {
  try {
    console.log('🧹 Cascade cleanup for deleted book:', data.bookId);
    
    // Request Borrowing module to delete historical borrows
    eventBus.emit('borrow.cleanup.request', {
      bookId: data.bookId,
      statuses: ['rejected', 'returned', 'overdue', 'revoked']
    });
    
    // Request Notifications module to delete related notifications
    eventBus.emit('notification.cleanup.request', {
      relatedId: data.bookId,
      relatedModel: 'Book'
    });
    
    console.log('✅ Cascade cleanup requests sent for book:', data.bookId);
  } catch (error) {
    console.error('❌ Book cascade cleanup failed:', error.message);
  }
});

// ===== BORROW CANCELLED CASCADE =====
eventBus.on(EventTypes.BORROW_CANCELLED, async (data) => {
  try {
    console.log('🧹 Cascade cleanup for cancelled borrow:', data.borrowId);
    
    // Request Notifications module to delete related notifications
    eventBus.emit('notification.cleanup.request', {
      relatedId: data.borrowId,
      relatedModel: 'Borrow'
    });
    
    console.log('✅ Cascade cleanup request sent for borrow:', data.borrowId);
  } catch (error) {
    console.error('❌ Borrow cascade cleanup failed:', error.message);
  }
});

// ===== USER DELETED CASCADE (for future implementation) =====
eventBus.on('user.deleted', async (data) => {
  try {
    console.log('🧹 Cascade cleanup for deleted user:', data.userId);
    
    // Request Books module to delete user's books
    eventBus.emit('book.cleanup.byowner.request', {
      ownerId: data.userId
    });
    
    // Request Borrowing module to delete user's borrows
    eventBus.emit('borrow.cleanup.byuser.request', {
      userId: data.userId
    });
    
    // Request Notifications module to delete user's notifications
    eventBus.emit('notification.cleanup.request', {
      userId: data.userId
    });
    
    console.log('✅ Cascade cleanup requests sent for user:', data.userId);
  } catch (error) {
    console.error('❌ User cascade cleanup failed:', error.message);
  }
});

console.log('✅ CascadeCleanupListener registered for cascade operations');
