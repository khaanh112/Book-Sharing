/**
 * BaseQuery - Base class for all queries
 * Queries represent read operations
 */

class BaseQuery {
  constructor() {
    this.timestamp = Date.now();
    this.correlationId = this.generateCorrelationId();
  }

  /**
   * Validate query parameters
   * Override in subclasses
   */
  validate() {
    // Override in subclasses
  }

  /**
   * Generate unique correlation ID for tracking
   * @returns {string}
   */
  generateCorrelationId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get query metadata
   * @returns {object}
   */
  getMetadata() {
    return {
      queryName: this.constructor.name,
      timestamp: this.timestamp,
      correlationId: this.correlationId
    };
  }
}

export default BaseQuery;