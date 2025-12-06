import Book from '../../../domain/Book.model.js';
import cache from '../../../../../shared/utils/cache.js';

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

      // Invalidate related caches
      await this.invalidateCache();

      console.log(`✓ Book created successfully: ${book._id}`);

      // TODO: Emit BookCreated event here when event system is implemented
      // eventBus.emit('book.created', { bookId: book._id, ownerId: book.owner, title: book.title });

      return book;
    } catch (error) {
      console.error('Error in CreateBookHandler:', error);
      throw new Error(`Failed to create book: ${error.message}`);
    }
  }

  /**
   * Invalidate related caches after book creation
   */
  async invalidateCache() {
    try {
      // Invalidate books list caches
      await cache.del('books:all');
      await cache.del('books:available');
      
      // Pattern to delete all paginated books caches
      await cache.delPattern('books:page:*');
      
      // CRITICAL: Invalidate user-specific book caches (my books)
      await cache.delPattern('user:*:books:*');
      
      // Invalidate search caches
      await cache.delPattern('search:*');
      
      console.log('✓ Book list caches invalidated');
    } catch (error) {
      console.error('Error invalidating cache:', error);
      // Don't throw - cache invalidation failure shouldn't fail the command
    }
  }
}

export default CreateBookHandler;