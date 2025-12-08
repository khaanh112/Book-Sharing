// modules/borrowing/infrastructure/BorrowingModuleListener.js
import eventBus from '../../../shared/events/EventBus.js';
import Borrow from '../domain/Borrow.model.js';

/**
 * BorrowingModuleListener - Handles incoming event requests for Borrowing module
 * TRUE EVENT-DRIVEN: Module listens to requests and responds via events
 */

// ===== CHECK ACTIVE BORROWS (for book deletion validation) =====
eventBus.on('borrow.check.active.request', async (data) => {
  try {
    console.log(` Borrowing module: Checking active borrows for book: ${data.bookId}`);
    
    const activeBorrows = await Borrow.countDocuments({
      bookId: data.bookId,
      status: { $in: ['pending', 'accepted'] }
    });
    
    const error = activeBorrows > 0
      ? 'Cannot delete book with active borrow requests'
      : null;
    
    eventBus.emit(data.responseEvent || 'borrow.check.active.response', {
      bookId: data.bookId,
      count: activeBorrows,
      error
    });
    
    console.log(` Borrowing module: Found ${activeBorrows} active borrows`);
  } catch (error) {
    console.error(' Borrowing module: Check active borrows failed:', error.message);
    eventBus.emit(data.responseEvent || 'borrow.check.active.response', {
      bookId: data.bookId,
      error: 'Check failed'
    });
  }
});

// ===== CLEANUP BORROWS BY BOOK (for cascade delete) =====
eventBus.on('borrow.cleanup.request', async (data) => {
  try {
    console.log(` Borrowing module: Cleaning up borrows for book: ${data.bookId}`);
    
    const result = await Borrow.deleteMany({
      bookId: data.bookId,
      status: { $in: data.statuses || [] }
    });
    
    console.log(` Borrowing module: Deleted ${result.deletedCount} historical borrows`);
  } catch (error) {
    console.error(' Borrowing module: Cleanup borrows failed:', error.message);
  }
});

// ===== CLEANUP BORROWS BY USER (for user deletion) =====
eventBus.on('borrow.cleanup.byuser.request', async (data) => {
  try {
    console.log(` Borrowing module: Cleaning up borrows for user: ${data.userId}`);
    
    const result = await Borrow.deleteMany({
      $or: [
        { borrowerId: data.userId },
        { ownerId: data.userId }
      ]
    });
    
    console.log(` Borrowing module: Deleted ${result.deletedCount} borrows for user`);
  } catch (error) {
    console.error(' Borrowing module: Cleanup by user failed:', error.message);
  }
});

console.log(' BorrowingModuleListener registered');
