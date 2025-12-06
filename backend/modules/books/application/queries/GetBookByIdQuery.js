import BaseQuery from './BaseQuery.js';

/**
 * GetBookByIdQuery - Query for retrieving a book by ID
 */
class GetBookByIdQuery extends BaseQuery {
  constructor(data) {
    super();
    this.bookId = typeof data === 'string' ? data : data.bookId;
    this.userId = typeof data === 'object' ? data.userId : null; // Optional: for personalized data
  }

  /**
   * Validate query parameters
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.bookId) {
      throw new Error('GetBookByIdQuery validation failed: Book ID is required');
    }
  }
}

export default GetBookByIdQuery;