import BaseCommand from './BaseCommand.js';

/**
 * CreateBookCommand - Command for creating a new book
 */
class CreateBookCommand extends BaseCommand {
  constructor(data) {
    super();
    this.title = data.title;
    this.authors = data.authors;
    this.isbn = data.isbn;
    this.description = data.description;
    this.thumbnail = data.thumbnail;
    this.category = data.category;
    this.ownerId = data.ownerId;
    this.available = data.available !== undefined ? data.available : true;
  }

  /**
   * Validate command data
   * @throws {Error} If validation fails
   */
  validate() {
    const errors = [];
    
    if (!this.title || this.title.trim().length === 0) {
      errors.push('Title is required');
    }
    
    if (!this.authors || this.authors.trim().length === 0) {
      errors.push('Authors are required');
    }
    
    if (!this.ownerId) {
      errors.push('Owner is required');
    }
    
    if (errors.length > 0) {
      throw new Error(`CreateBookCommand validation failed: ${errors.join(', ')}`);
    }
  }
}

export default CreateBookCommand;