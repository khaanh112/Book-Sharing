import BaseQuery from './BaseQuery.js';

/**
 * GetAllBooksQuery - Query for retrieving all books with filters
 */
class GetAllBooksQuery extends BaseQuery {
  constructor(data = {}) {
    super();
    this.q = data.q; // Search query
    this.authors = data.authors;
    this.category = data.category;
    this.available = data.available;
    this.page = parseInt(data.page) || 1;
    this.limit = data.limit || 12; // Fixed limit per page
  }

  /**
   * Validate query parameters
   * @throws {Error} If validation fails
   */
  validate() {
    if (this.page < 1) {
      throw new Error('GetAllBooksQuery validation failed: Page must be >= 1');
    }

    if (this.limit < 1 || this.limit > 100) {
      throw new Error('GetAllBooksQuery validation failed: Limit must be between 1 and 100');
    }
  }

  /**
   * Check if query has filters
   * @returns {boolean}
   */
  hasFilters() {
    return !!(this.q || this.authors || this.category || this.available !== undefined);
  }

  /**
   * Build MongoDB filter object
   * @returns {object}
   */
  buildFilter() {
    const filter = {};

    if (this.q) {
      filter.$or = [
        { title: { $regex: this.q, $options: 'i' } },
        { description: { $regex: this.q, $options: 'i' } }
      ];
    }

    if (this.authors) {
      filter.authors = { $regex: this.authors, $options: 'i' };
    }

    if (this.category) {
      filter.categories = this.category;
    }

    if (this.available !== undefined) {
      filter.available = this.available === 'true' || this.available === true;
    }

    return filter;
  }

  /**
   * Calculate skip value for pagination
   * @returns {number}
   */
  getSkip() {
    return (this.page - 1) * this.limit;
  }
}

export default GetAllBooksQuery;