import Book from '../../../domain/Book.model.js';
import eventBus from '../../../../../shared/events/EventBus.js';

/**
 * CreateBookHandler - Handles CreateBookCommand
 * Creates a new book in the database
 */
class CreateBookHandler {
  /**
   * Handle the CreateBookCommand
   * @param {CreateBookCommand} command - The command to handle
   * @returns {Promise<object>} The created book
   */
  async handle(command) {
    // Validate command
    command.validate();

    try {
      // Create book in database
      const book = await Book.create({
        title: command.title,
        authors: command.authors,
        isbn: command.isbn,
        description: command.description,
        thumbnail: command.thumbnail,
        categories: command.category && command.category.trim() ? [command.category.trim()] : [],
        ownerId: command.ownerId,
        available: command.available
      });

      console.log(`✓ Book created successfully: ${book._id}`);

      // Emit BookCreated event for read model sync
      eventBus.emit('book.created', { 
        bookId: book._id, 
        ownerId: book.ownerId, 
        title: book.title 
      });

      return book;
    } catch (error) {
      console.error('Error in CreateBookHandler:', error);
      throw new Error(`Failed to create book: ${error.message}`);
    }
  }
}

export default CreateBookHandler;