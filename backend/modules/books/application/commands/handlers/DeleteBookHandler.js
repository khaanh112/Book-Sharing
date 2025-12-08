import Book from '../../../domain/Book.model.js';
import cloudinary from '../../../../../config/cloudinary.js';
import eventBus from '../../../../../shared/events/EventBus.js';

/**
 * DeleteBookHandler - Handles DeleteBookCommand
 * Deletes a book from the database
 * 
 * TRUE EVENT-DRIVEN: No cross-module dependencies
 * Emits event to check active borrows via shared listener
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

      // Emit pre-delete validation event (synchronous check via listener)
      // CascadeCleanupListener will check and throw if book has active borrows
      const validationError = await this.validateBookDeletion(command.bookId);
      
      if (validationError) {
        throw new Error(validationError);
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

      console.log(`✓ Book deleted successfully: ${command.bookId}`);

      // Emit BookDeleted event for read model sync
      eventBus.emit('book.deleted', { 
        bookId: command.bookId, 
        ownerId: command.userId 
      });

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
   * Validate book deletion via event-driven check
   * Returns error message if validation fails, null if ok
   */
  async validateBookDeletion(bookId) {
    return new Promise((resolve) => {
      // Create one-time listener for validation response
      const responseHandler = (data) => {
        if (data.bookId === bookId) {
          eventBus.removeListener('book.delete.validation.response', responseHandler);
          resolve(data.error || null);
        }
      };
      
      eventBus.on('book.delete.validation.response', responseHandler);
      
      // Emit validation request
      eventBus.emit('book.delete.validation.request', { bookId });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        eventBus.removeListener('book.delete.validation.response', responseHandler);
        resolve(null); // Allow deletion if no response
      }, 5000);
    });
  }
}

export default DeleteBookHandler;