import Book from '../../../domain/Book.model.js';
import bookReadModel from '../../../infrastructure/BookReadModelRepository.js';

/**
 * GetMyBooksHandler - Handles GetMyBooksQuery
 * TRUE CQRS: Reads from Redis Read Model with MongoDB fallback
 */
class GetMyBooksHandler {
  /**
   * Handle the GetMyBooksQuery
   * @param {GetMyBooksQuery} query - The query to handle
   * @returns {Promise<object>} User's books with pagination
   */
  async handle(query) {
    // Validate query
    query.validate();

    try {
      // TRUE CQRS: Try Redis Read Model first (no filters only)
      if (query.available === undefined) {
        console.log(`🔍 Reading user ${query.userId} books from Redis...`);
        const result = await bookReadModel.getBooksByOwner(query.userId, query.page, query.limit);
        
        if (result.books && result.books.length > 0) {
          console.log(`⚡ Read Model HIT: ${result.books.length} books for user ${query.userId}`);
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

      // If no filters, sync to read model (async)
      if (query.available === undefined && books.length > 0) {
        books.forEach(book => {
          bookReadModel.saveBook(book).catch(err => 
            console.error('Failed to sync book:', err)
          );
        });
      }

      return result;
    } catch (error) {
      console.error('Error in GetMyBooksHandler:', error);
      throw new Error(`Failed to retrieve user books: ${error.message}`);
    }
  }
}

export default GetMyBooksHandler;