import Book from '../../../domain/Book.model.js';
import cache from '../../../../../shared/utils/cache.js';

/**
 * GetAllBooksHandler - Handles GetAllBooksQuery
 * Retrieves all books with optional filters and pagination
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
    const filter = query.buildFilter();
    const skip = query.getSkip();

    try {
      // Use cache only if no filters applied
      if (!hasFilters) {
        const cacheKey = `books:page:${query.page}`;
        const cached = await cache.getJSON(cacheKey);
        
        if (cached) {
          console.log(`⚡ Cache HIT for books page: ${query.page}`);
          return cached;
        }
        console.log(`⚡ Cache MISS for books page: ${query.page}`);
      }

      // Query database - removed populate for better performance
      // Frontend should fetch owner details separately if needed
      const [books, total] = await Promise.all([
        Book.find(filter)
          .populate('ownerId', 'name email')
          .skip(skip)
          .limit(query.limit)
          .select('title authors description thumbnail ownerId available categories googleBookId createdAt updatedAt')
          .sort({ createdAt: -1 })
          .lean(), // Plain JS objects - much faster
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

      // Cache the result if no filters (5 minutes TTL)
      if (!hasFilters) {
        const cacheKey = `books:page:${query.page}`;
        await cache.setJSON(cacheKey, result, 300);
        console.log(`✓ Books page cached: ${query.page}`);
      }

      return result;
    } catch (error) {
      console.error('Error in GetAllBooksHandler:', error);
      throw new Error(`Failed to retrieve books: ${error.message}`);
    }
  }
}

export default GetAllBooksHandler;