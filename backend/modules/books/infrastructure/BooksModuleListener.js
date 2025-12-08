// modules/books/infrastructure/BooksModuleListener.js
import eventBus from '../../../shared/events/EventBus.js';
import Book from '../domain/Book.model.js';

/**
 * BooksModuleListener - Handles incoming event requests for Books module
 * TRUE EVENT-DRIVEN: Module listens to requests and responds via events
 */

// ===== INITIAL SYNC REQUEST =====
eventBus.on('books.initial.sync.request', async (data) => {
  try {
    console.log(' Books module: Responding to initial sync request');
    
    const books = await Book.find()
      .populate('ownerId', 'name email')
      .lean();
    
    eventBus.emit('books.initial.sync.response', { books });
    console.log(`✅ Books module: Sent ${books.length} books for sync`);
  } catch (error) {
    console.error(' Books module: Initial sync response failed:', error.message);
    eventBus.emit('books.initial.sync.response', { books: [] });
  }
});

// ===== BOOK CLEANUP BY OWNER (for user deletion) =====
eventBus.on('book.cleanup.byowner.request', async (data) => {
  try {
    console.log(`🧹 Books module: Cleaning up books for owner: ${data.ownerId}`);
    
    const books = await Book.find({ ownerId: data.ownerId });
    
    for (const book of books) {
      await Book.findByIdAndDelete(book._id);
      eventBus.emit('book.deleted', {
        bookId: book._id,
        ownerId: data.ownerId
      });
    }
    
    console.log(`✅ Books module: Deleted ${books.length} books for owner: ${data.ownerId}`);
  } catch (error) {
    console.error('❌ Books module: Cleanup by owner failed:', error.message);
  }
});

console.log(' BooksModuleListener registered');
