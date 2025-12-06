import Book from '../../../domain/Book.model.js';
import cache from '../../../../../shared/utils/cache.js';

/**
 * SearchBooksHandler - Handles SearchBooksQuery
 * Performs advanced book search with caching
 */
class SearchBooksHandler {
  /**
   * Handle the SearchBooksQuery
   * @param {SearchBooksQuery} query - The query to handle
   * @returns {Promise<object>} Search results with pagination
   */
  async handle(query) {
    // Validate query
    query.validate();

    const searchFilter = query.buildSearchFilter();
    const sortObject = query.getSortObject();
    const skip = query.getSkip();

    // Create cache key from search parameters
    const cacheKey = `search:${query.searchTerm}:${query.page}:${query.sortBy}:${query.sortOrder}`;

    try {
      // Try cache first
      const cached = await cache.getJSON(cacheKey);
      
      if (cached) {
        console.log(`⚡ Cache HIT for search: ${query.searchTerm}`);
        return cached;
      }

      console.log(`⚡ Cache MISS for search: ${query.searchTerm}`);

      // Perform search - removed populate for better performance
      // Frontend should fetch owner details separately if needed
      const [books, total] = await Promise.all([
        Book.find(searchFilter)
          .populate('ownerId', 'name email')
          .skip(skip)
          .limit(query.limit)
          .sort(sortObject)
          .select('title authors description thumbnail ownerId available categories createdAt')
          .lean(),
        Book.countDocuments(searchFilter)
      ]);

      const result = {
        books,
        searchTerm: query.searchTerm,
        currentPage: query.page,
        totalPages: Math.ceil(total / query.limit),
        totalResults: total,
        hasNextPage: query.page < Math.ceil(total / query.limit),
        hasPrevPage: query.page > 1
      };

      // Cache search results for 3 minutes
      await cache.setJSON(cacheKey, result, 180);
      console.log(`✓ Search results cached: ${query.searchTerm}`);

      return result;
    } catch (error) {
      console.error('Error in SearchBooksHandler:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }
}

export default SearchBooksHandler;