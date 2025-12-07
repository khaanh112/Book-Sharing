import eventBus from '../EventBus.js';
import bookReadModel from '../../../modules/books/infrastructure/BookReadModelRepository.js';
import Book from '../../../modules/books/domain/Book.model.js';

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
        
        // Fetch full book data with owner populated
        const book = await Book.findById(data.bookId)
          .populate('ownerId', 'name email')
          .lean();

        if (book) {
          await bookReadModel.saveBook(book);
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
        
        // Fetch updated book data with owner
        const book = await Book.findById(data.bookId)
          .populate('ownerId', 'name email')
          .lean();

        if (book) {
          await bookReadModel.saveBook(book); // Overwrite
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
        
        const book = await Book.findById(data.bookId)
          .populate('ownerId', 'name email')
          .lean();

        if (book) {
          await bookReadModel.saveBook(book); // Update with new availability
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
        
        const book = await Book.findById(data.bookId)
          .populate('ownerId', 'name email')
          .lean();

        if (book) {
          await bookReadModel.saveBook(book); // Update with new availability
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
      
      // CRITICAL: Clear cache and bypass Mongoose cache
      // Use native MongoDB driver to ensure we get fresh data
      const mongoose = await import('mongoose');
      const booksCollection = mongoose.default.connection.collection('books');
      const booksFromMongo = await booksCollection.find({}).toArray();
      
      console.log(`📊 Direct MongoDB query found ${booksFromMongo.length} books`);
      booksFromMongo.forEach(book => {
        console.log(`   [MONGO] ${book._id}: ${book.title} (available=${book.available})`);
      });
      
      const books = await Book.find()
        .populate('ownerId', 'name email')
        .lean();

      console.log(`📊 Mongoose query found ${books.length} books:`);
      books.forEach(book => {
        console.log(`   [MONGOOSE] ${book._id}: ${book.title} (available=${book.available})`);
      });

      await bookReadModel.rebuildFromSource(books);
      
      console.log(`✅ Initial sync complete: ${books.length} books synced to read model`);
      return true;
    } catch (error) {
      console.error('❌ Initial sync failed:', error);
      return false;
    }
  }
}

export default new ReadModelSyncListener();
