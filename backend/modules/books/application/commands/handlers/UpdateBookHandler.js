import Book from '../../../domain/Book.model.js';
import cache from '../../../../../shared/utils/cache.js';
import mongoose from 'mongoose';

/**
 * UpdateBookHandler - Handles UpdateBookCommand
 * Updates an existing book in the database
 */
class UpdateBookHandler {
  /**
   * Handle the UpdateBookCommand
   * @param {UpdateBookCommand} command - The command to handle
   * @returns {Promise<object>} The updated book
   */
  async handle(command) {
    // Validate command
    command.validate();

    try {
      // Find the book
      const book = await Book.findById(command.bookId);
      
      if (!book) {
        throw new Error('Book not found');
      }

      // Check authorization - only owner can update
      if (book.ownerId.toString() !== command.userId.toString()) {
        throw new Error('Unauthorized: Only the book owner can update this book');
      }

      // Update fields if provided
      if (command.title !== undefined) book.title = command.title;
      if (command.authors !== undefined) book.authors = command.authors;
      if (command.isbn !== undefined) book.isbn = command.isbn;
      if (command.description !== undefined) book.description = command.description;
      if (command.thumbnail !== undefined) book.thumbnail = command.thumbnail;
      if (command.category !== undefined) {
        book.categories = command.category && command.category.trim() ? [command.category.trim()] : [];
      }
      if (command.available !== undefined) book.available = command.available;

      // Save updated book
      await book.save();

      // Invalidate related caches
      await this.invalidateCache(command.bookId);

      console.log(`✓ Book updated successfully: ${book._id}`);

      // TODO: Emit BookUpdated event here when event system is implemented
      // eventBus.emit('book.updated', { bookId: book._id, ownerId: book.owner, changes: {...} });

      return book;
    } catch (error) {
      console.error('Error in UpdateBookHandler:', error);
      throw error;
    }
  }

  /**
   * Invalidate related caches after book update
   * @param {string} bookId - ID of the updated book
   */
  async invalidateCache(bookId) {
    try {
      // Invalidate specific book cache
      await cache.del(`book:${bookId}`);
      
      // Invalidate books list caches
      await cache.del('books:all');
      await cache.del('books:available');
      
      // Pattern to delete all paginated books caches
      await cache.delPattern('books:page:*');
      await cache.delPattern('search:*');
      
      // CRITICAL: Invalidate user-specific book caches (my books)
      await cache.delPattern('user:*:books:*');
      
      console.log('✓ Book caches invalidated');
    } catch (error) {
      console.error('Error invalidating cache:', error);
      // Don't throw - cache invalidation failure shouldn't fail the command
    }
  }
}

export default UpdateBookHandler;