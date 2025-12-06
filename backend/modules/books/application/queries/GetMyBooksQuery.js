import BaseQuery from './BaseQuery.js';

/**
 * GetMyBooksQuery - Query for retrieving books owned by a user
 */
class GetMyBooksQuery extends BaseQuery {
  constructor(data = {}) {
    super();
    this.userId = data.userId;
    this.page = parseInt(data.page) || 1;
    this.limit = parseInt(data.limit) || 12;
    this.available = data.available; // Optional filter
  }

  /**
   * Validate query parameters
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.userId) {
      throw new Error('GetMyBooksQuery validation failed: User ID is required');
    }

    if (this.page < 1) {
      throw new Error('GetMyBooksQuery validation failed: Page must be >= 1');
    }

    if (this.limit < 1 || this.limit > 100) {
      throw new Error('GetMyBooksQuery validation failed: Limit must be between 1 and 100');
    }
  }

  /**
   * Build filter for user's books
   * @returns {object}
   */
  buildFilter() {
    const filter = { ownerId: this.userId };

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

export default GetMyBooksQuery;