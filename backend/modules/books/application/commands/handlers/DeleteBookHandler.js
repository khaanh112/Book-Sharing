import Book from '../../../domain/Book.model.js';
import Borrow from '../../../../borrowing/domain/Borrow.model.js';
import cache from '../../../../../shared/utils/cache.js';
import cloudinary from '../../../../../config/cloudinary.js';

/**
 * DeleteBookHandler - Handles DeleteBookCommand
 * Deletes a book from the database
 */
class DeleteBookHandler {
  /**
   * Handle the DeleteBookCommand
   * @param {DeleteBookCommand} command - The command to handle
   * @returns {Promise<object>} Deletion confirmation
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

      // Check authorization - only owner can delete
      if (book.ownerId.toString() !== command.userId.toString()) {
        throw new Error('Unauthorized: Only the book owner can delete this book');
      }

      // Check if book has active borrows
      const activeBorrows = await Borrow.countDocuments({
        book: command.bookId,
        status: { $in: ['pending', 'accepted'] }
      });

      if (activeBorrows > 0) {
        throw new Error('Cannot delete book with active borrow requests');
      }

      // Delete book image from Cloudinary if exists
      if (book.thumbnail && book.thumbnail.includes('cloudinary')) {
        try {
          const publicId = this.extractPublicId(book.thumbnail);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
            console.log(`✓ Book image deleted from Cloudinary: ${publicId}`);
          }
        } catch (cloudinaryError) {
          console.error('Error deleting from Cloudinary:', cloudinaryError);
          // Continue with book deletion even if Cloudinary deletion fails
        }
      }

      // Delete the book
      await Book.findByIdAndDelete(command.bookId);

      // Invalidate related caches
      await this.invalidateCache(command.bookId);

      console.log(`✓ Book deleted successfully: ${command.bookId}`);

      // TODO: Emit BookDeleted event here when event system is implemented
      // eventBus.emit('book.deleted', { bookId: command.bookId, ownerId: command.userId });

      return {
        success: true,
        message: 'Book deleted successfully',
        bookId: command.bookId
      };
    } catch (error) {
      console.error('Error in DeleteBookHandler:', error);
      throw error;
    }
  }

  /**
   * Extract Cloudinary public ID from URL
   * @param {string} url - Cloudinary URL
   * @returns {string|null} Public ID or null
   */
  extractPublicId(url) {
    try {
      const matches = url.match(/\/upload\/(?:v\d+\/)?(.*?)\.[^.]+$/);
      return matches ? matches[1] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Invalidate related caches after book deletion
   * @param {string} bookId - ID of the deleted book
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
      await cache.delPattern(`user:*:books:*`);
      
      console.log('✓ Book caches invalidated');
    } catch (error) {
      console.error('Error invalidating cache:', error);
      // Don't throw - cache invalidation failure shouldn't fail the command
    }
  }
}

export default DeleteBookHandler;