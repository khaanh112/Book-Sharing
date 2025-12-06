/**
 * QueryBus - Dispatches queries to their respective handlers
 * Part of CQRS Pattern implementation
 */

import { cqrsQueryExecuted } from '../shared/utils/metrics.js';

class QueryBus {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Register a query handler
   * @param {string} queryName - Name of the query class
   * @param {object} handler - Handler instance with handle() method
   */
  register(queryName, handler) {
    if (!handler || typeof handler.handle !== 'function') {
      throw new Error(`Handler for ${queryName} must have a handle() method`);
    }
    this.handlers.set(queryName, handler);
    console.log(`✓ Registered query handler: ${queryName}`);
  }

  /**
   * Execute a query
   * @param {object} query - Query instance to execute
   * @returns {Promise<any>} Result from query handler
   */
  async execute(query) {
    const queryName = query.constructor.name;
    const handler = this.handlers.get(queryName);

    if (!handler) {
      throw new Error(`No handler registered for query: ${queryName}`);
    }

    console.log(`🔍 Executing query: ${queryName}`);
    
    try {
      const result = await handler.handle(query);
      cqrsQueryExecuted.inc({ query: queryName });
      console.log(`✓ Query executed successfully: ${queryName}`);
      return result;
    } catch (error) {
      console.error(`✗ Query execution failed: ${queryName}`, error.message);
      throw error;
    }
  }

  /**
   * Check if a handler is registered
   * @param {string} queryName - Name of the query
   * @returns {boolean}
   */
  hasHandler(queryName) {
    return this.handlers.has(queryName);
  }

  /**
   * Get all registered query names
   * @returns {string[]}
   */
  getRegisteredQueries() {
    return Array.from(this.handlers.keys());
  }
}

// Singleton instance
const queryBus = new QueryBus();

export default queryBus;