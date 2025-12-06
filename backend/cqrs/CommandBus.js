/**
 * CommandBus - Dispatches commands to their respective handlers
 * Part of CQRS Pattern implementation
 */

import { cqrsCommandExecuted } from '../shared/utils/metrics.js';

class CommandBus {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Register a command handler
   * @param {string} commandName - Name of the command class
   * @param {object} handler - Handler instance with handle() method
   */
  register(commandName, handler) {
    if (!handler || typeof handler.handle !== 'function') {
      throw new Error(`Handler for ${commandName} must have a handle() method`);
    }
    this.handlers.set(commandName, handler);
    console.log(`✓ Registered command handler: ${commandName}`);
  }

  /**
   * Execute a command
   * @param {object} command - Command instance to execute
   * @returns {Promise<any>} Result from command handler
   */
  async execute(command) {
    const commandName = command.constructor.name;
    const handler = this.handlers.get(commandName);

    if (!handler) {
      throw new Error(`No handler registered for command: ${commandName}`);
    }

    console.log(`⚡ Executing command: ${commandName}`);
    
    try {
      const result = await handler.handle(command);
      cqrsCommandExecuted.inc({ command: commandName });
      console.log(`✓ Command executed successfully: ${commandName}`);
      return result;
    } catch (error) {
      console.error(`✗ Command execution failed: ${commandName}`, error.message);
      throw error;
    }
  }

  /**
   * Check if a handler is registered
   * @param {string} commandName - Name of the command
   * @returns {boolean}
   */
  hasHandler(commandName) {
    return this.handlers.has(commandName);
  }

  /**
   * Get all registered command names
   * @returns {string[]}
   */
  getRegisteredCommands() {
    return Array.from(this.handlers.keys());
  }
}

// Singleton instance
const commandBus = new CommandBus();

export default commandBus;