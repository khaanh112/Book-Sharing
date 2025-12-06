import BaseQuery from './BaseQuery.js';

/**
 * SearchBooksQuery - Query for searching books with advanced options
 */
class SearchBooksQuery extends BaseQuery {
  constructor(data = {}) {
    super();
    this.searchTerm = data.searchTerm || data.q;
    this.page = parseInt(data.page) || 1;
    this.limit = parseInt(data.limit) || 12;
    this.sortBy = data.sortBy || data.sort || 'createdAt';
    this.sortOrder = data.sortOrder === 'asc' ? 1 : -1;
  }

  /**
   * Validate query parameters
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.searchTerm || this.searchTerm.trim().length === 0) {
      throw new Error('SearchBooksQuery validation failed: Search term is required');
    }

    if (this.page < 1) {
      throw new Error('SearchBooksQuery validation failed: Page must be >= 1');
    }

    if (this.limit < 1 || this.limit > 100) {
      throw new Error('SearchBooksQuery validation failed: Limit must be between 1 and 100');
    }
  }

  /**
   * Build search filter
   * @returns {object}
   */
  buildSearchFilter() {
    return {
      $or: [
        { title: { $regex: this.searchTerm, $options: 'i' } },
        { authors: { $regex: this.searchTerm, $options: 'i' } },
        { description: { $regex: this.searchTerm, $options: 'i' } },
        { isbn: { $regex: this.searchTerm, $options: 'i' } }
      ]
    };
  }

  /**
   * Get sort object
   * @returns {object}
   */
  getSortObject() {
    return { [this.sortBy]: this.sortOrder };
  }

  /**
   * Calculate skip value for pagination
   * @returns {number}
   */
  getSkip() {
    return (this.page - 1) * this.limit;
  }
}

export default SearchBooksQuery;