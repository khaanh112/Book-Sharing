import eventBus from '../EventBus.js';
import bookReadModel from '../../../modules/books/infrastructure/BookReadModelRepository.js';

/**
 * ReadModelSyncListener - Syncs MongoDB writes to Redis read models
 * This is the CORE of TRUE CQRS pattern
 * 
 * Flow: Write to MongoDB → Emit Event → Sync to Redis
 */
class ReadModelSyncListener {
  constructor() {
    this.registerListeners();
  }

  registerListeners() {
    console.log('📢 Registering Read Model Sync Listeners...');

    // Book Created - Add to read model
    eventBus.on('book.created', async (data) => {
      try {
        console.log('🔄 Syncing new book to read model:', data.bookId);
        
        // Use book data from event (already populated)
        if (data.book) {
          await bookReadModel.saveBook(data.book);
          await bookReadModel.invalidateSearchCache();
          console.log('✅ Book added to read model:', data.bookId);
        }
      } catch (error) {
        console.error('❌ Failed to sync book creation to read model:', error);
      }
    });

    // Book Updated - Update in read model
    eventBus.on('book.updated', async (data) => {
      try {
        console.log('🔄 Syncing book update to read model:', data.bookId);
        
        // Use book data from event (already populated)
        if (data.book) {
          await bookReadModel.saveBook(data.book); // Overwrite
          await bookReadModel.invalidateSearchCache();
          console.log('✅ Book updated in read model:', data.bookId);
        } else {
          // If book not found, it was deleted - remove from read model
          await bookReadModel.deleteBook(data.bookId);
        }
      } catch (error) {
        console.error('❌ Failed to sync book update to read model:', error);
      }
    });

    // Book Deleted - Remove from read model
    eventBus.on('book.deleted', async (data) => {
      try {
        console.log('🔄 Removing book from read model:', data.bookId);
        
        await bookReadModel.deleteBook(data.bookId);
        await bookReadModel.invalidateSearchCache();
        console.log('✅ Book removed from read model:', data.bookId);
      } catch (error) {
        console.error('❌ Failed to remove book from read model:', error);
      }
    });

    // Book Borrowed - Update availability in read model
    eventBus.on('book.borrowed', async (data) => {
      try {
        console.log('🔄 Updating book availability in read model:', data.bookId);
        
        // Use book data from event if provided
        if (data.book) {
          await bookReadModel.saveBook(data.book); // Update with new availability
          console.log('✅ Book availability updated in read model:', data.bookId);
        }
      } catch (error) {
        console.error('❌ Failed to update book availability in read model:', error);
      }
    });

    // Book Returned - Update availability in read model
    eventBus.on('book.returned', async (data) => {
      try {
        console.log('🔄 Updating book availability in read model:', data.bookId);
        
        // Use book data from event if provided
        if (data.book) {
          await bookReadModel.saveBook(data.book); // Update with new availability
          console.log('✅ Book availability updated in read model:', data.bookId);
        }
      } catch (error) {
        console.error('❌ Failed to update book availability in read model:', error);
      }
    });

    console.log('✅ Read Model Sync Listeners registered');
  }

  /**
   * Initial sync - rebuild read model from MongoDB
   * Call this on application startup
   */
  async performInitialSync() {
    try {
      console.log('🔄 Performing initial read model sync...');
      
      // Emit event to request books data from Books module
      return new Promise((resolve) => {
        const responseHandler = async (data) => {
          try {
            eventBus.removeListener('books.initial.sync.response', responseHandler);
            
            const books = data.books || [];
            console.log(`📊 Received ${books.length} books from Books module`);
            
            await bookReadModel.rebuildFromSource(books);
            console.log(`✅ Initial sync complete: ${books.length} books synced to read model`);
            resolve(true);
          } catch (error) {
            console.error('❌ Initial sync failed:', error);
            resolve(false);
          }
        };
        
        eventBus.on('books.initial.sync.response', responseHandler);
        eventBus.emit('books.initial.sync.request', {});
        
        // Timeout after 10 seconds
        setTimeout(() => {
          eventBus.removeListener('books.initial.sync.response', responseHandler);
          console.error('❌ Initial sync timeout - no response from Books module');
          resolve(false);
        }, 10000);
      });
    } catch (error) {
      console.error('❌ Initial sync failed:', error);
      return false;
    }
  }
}

export default new ReadModelSyncListener();
