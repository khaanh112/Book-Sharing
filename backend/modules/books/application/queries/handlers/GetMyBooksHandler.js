import Book from '../../../domain/Book.model.js';
import cache from '../../../../../shared/utils/cache.js';

/**
 * GetMyBooksHandler - Handles GetMyBooksQuery
 * Retrieves books owned by a specific user
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

    const filter = query.buildFilter();
    const skip = query.getSkip();

    // Create cache key
    const cacheKey = `user:${query.userId}:books:page:${query.page}${query.available !== undefined ? `:available:${query.available}` : ''}`;

    try {
      // Try cache first
      const cached = await cache.getJSON(cacheKey);
      
      if (cached) {
        console.log(`⚡ Cache HIT for user books: ${query.userId}`);
        return cached;
      }

      console.log(`⚡ Cache MISS for user books: ${query.userId}`);

      // Query database
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

      // Cache for 5 minutes
      await cache.setJSON(cacheKey, result, 300);
      console.log(`✓ User books cached: ${query.userId}`);

      return result;
    } catch (error) {
      console.error('Error in GetMyBooksHandler:', error);
      throw new Error(`Failed to retrieve user books: ${error.message}`);
    }
  }
}

export default GetMyBooksHandler;