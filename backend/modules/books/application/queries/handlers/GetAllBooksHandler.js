import Book from '../../../domain/Book.model.js';
import bookReadModel from '../../../infrastructure/BookReadModelRepository.js';

/**
 * GetAllBooksHandler - Handles GetAllBooksQuery
 * TRUE CQRS: Reads from Redis (Read Model) instead of MongoDB
 * Fallback to MongoDB if Redis is empty
 */
class GetAllBooksHandler {
  /**
   * Handle the GetAllBooksQuery
   * @param {GetAllBooksQuery} query - The query to handle
   * @returns {Promise<object>} Paginated books data
   */
  async handle(query) {
    // Validate query
    query.validate();

    const hasFilters = query.hasFilters();

    try {
      // TRUE CQRS: Read from Redis Read Model (no filters only)
      if (!hasFilters) {
        console.log(`🔍 Reading from Redis Read Model (page ${query.page})...`);
        const result = await bookReadModel.getAllBooks(query.page, query.limit);
        
        // If read model has data, return immediately (2-5ms response!)
        if (result.books && result.books.length > 0) {
          console.log(`⚡ Read Model HIT: ${result.books.length} books (page ${query.page})`);
          return {
            books: result.books,
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            totalBooks: result.total,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage
          };
        }
        
        console.log('⚠️ Read Model empty - falling back to MongoDB');
      }

      // Fallback to MongoDB for filters or if read model is empty
      console.log('📊 Fallback: Reading from MongoDB...');
      const filter = query.buildFilter();
      const skip = query.getSkip();

      const [books, total] = await Promise.all([
        Book.find(filter)
          .populate('ownerId', 'name email')
          .skip(skip)
          .limit(query.limit)
          .select('title authors description thumbnail ownerId available categories googleBookId createdAt updatedAt')
          .sort({ createdAt: -1 })
          .lean(),
        Book.countDocuments(filter)
      ]);

      const result = {
        books,
        currentPage: query.page,
        totalPages: Math.ceil(total / query.limit),
        totalBooks: total,
        hasNextPage: query.page < Math.ceil(total / query.limit),
        hasPrevPage: query.page > 1
      };

      // If no filters, sync this to read model for next time
      if (!hasFilters && books.length > 0) {
        console.log('🔄 Syncing fallback data to read model...');
        // Async sync - don't await
        bookReadModel.rebuildFromSource(books).catch(err => 
          console.error('Failed to sync to read model:', err)
        );
      }

      return result;
    } catch (error) {
      console.error('Error in GetAllBooksHandler:', error);
      throw new Error(`Failed to retrieve books: ${error.message}`);
    }
  }
}

export default GetAllBooksHandler;