/**
 * BaseCommand - Base class for all commands
 * Commands represent write operations (Create, Update, Delete)
 */

class BaseCommand {
  constructor() {
    this.timestamp = Date.now();
    this.correlationId = this.generateCorrelationId();
  }

  /**
   * Validate command data
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
   * Get command metadata
   * @returns {object}
   */
  getMetadata() {
    return {
      commandName: this.constructor.name,
      timestamp: this.timestamp,
      correlationId: this.correlationId
    };
  }
}

export default BaseCommand;