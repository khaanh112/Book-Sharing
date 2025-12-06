import BaseCommand from './BaseCommand.js';

/**
 * DeleteBookCommand - Command for deleting a book
 */
class DeleteBookCommand extends BaseCommand {
  constructor(data) {
    super();
    this.bookId = data.bookId;
    this.userId = data.userId; // For authorization check
  }

  /**
   * Validate command data
   * @throws {Error} If validation fails
   */
  validate() {
    const errors = [];
    
    if (!this.bookId) {
      errors.push('Book ID is required');
    }
    
    if (!this.userId) {
      errors.push('User ID is required');
    }
    
    if (errors.length > 0) {
      throw new Error(`DeleteBookCommand validation failed: ${errors.join(', ')}`);
    }
  }
}

export default DeleteBookCommand;