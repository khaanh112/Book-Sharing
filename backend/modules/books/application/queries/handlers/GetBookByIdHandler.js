import Book from '../../../domain/Book.model.js';
import cache from '../../../../../shared/utils/cache.js';

/**
 * GetBookByIdHandler - Handles GetBookByIdQuery
 * Retrieves a book by ID with cache-first strategy
 */
class GetBookByIdHandler {
  /**
   * Handle the GetBookByIdQuery
   * @param {GetBookByIdQuery} query - The query to handle
   * @returns {Promise<object>} The book data
   */
  async handle(query) {
    // Validate query
    query.validate();

    const cacheKey = `book:${query.bookId}`;

    try {
      // Try to get from cache first
      const cached = await cache.getJSON(cacheKey);
      
      if (cached) {
        console.log(`⚡ Cache HIT for book: ${query.bookId}`);
        return cached;
      }

      console.log(`⚡ Cache MISS for book: ${query.bookId}`);

      // If not in cache, query from database
      // Query single book - removed populate for performance
      const book = await Book.findById(query.bookId)
        .populate('ownerId', 'name email')
        .select('title authors description thumbnail ownerId available categories googleBookId createdAt updatedAt')
        .lean();

      if (!book) {
        throw new Error('Book not found');
      }

      // Cache the result for 5 minutes (300 seconds)
      await cache.setJSON(cacheKey, book, 300);
      console.log(`✓ Book cached: ${query.bookId}`);

      return book;
    } catch (error) {
      console.error('Error in GetBookByIdHandler:', error);
      throw error;
    }
  }
}

export default GetBookByIdHandler;