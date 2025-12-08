/**
 * BaseQuery - Abstract base class for all queries
 */
class BaseQuery {
  constructor() {
    if (this.constructor === BaseQuery) {
      throw new Error('BaseQuery is an abstract class and cannot be instantiated directly');
    }
  }

  /**
   * Validate query parameters
   * Subclasses should override this method
   */
  validate() {
    throw new Error('validate() must be implemented by subclass');
  }
}

export default BaseQuery;
