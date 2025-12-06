import BaseCommand from './BaseCommand.js';

/**
 * UpdateBookCommand - Command for updating an existing book
 */
class UpdateBookCommand extends BaseCommand {
  constructor(data) {
    super();
    this.bookId = data.bookId;
    this.userId = data.userId; // For authorization check
    const updates = data.updates || data;
    this.title = updates.title;
    this.authors = updates.authors;
    this.isbn = updates.isbn;
    this.description = updates.description;
    this.thumbnail = updates.thumbnail;
    this.category = updates.category;
    this.available = updates.available;
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
    
    if (this.title !== undefined && this.title.trim().length === 0) {
      errors.push('Title cannot be empty');
    }
    
    if (this.authors !== undefined && this.authors.trim().length === 0) {
      errors.push('Authors cannot be empty');
    }
    
    if (errors.length > 0) {
      throw new Error(`UpdateBookCommand validation failed: ${errors.join(', ')}`);
    }
  }
}

export default UpdateBookCommand;