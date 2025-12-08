import Book from '../../../domain/Book.model.js';
import mongoose from 'mongoose';
import eventBus from '../../../../../shared/events/EventBus.js';

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

      // Check authorization - only owner can update (except for availability changes from borrow system)
      const updatedFields = Object.keys(command).filter(k => 
        command[k] !== undefined && 
        k !== 'bookId' && 
        k !== 'userId' &&
        k !== 'timestamp' &&
        k !== 'correlationId'
      );
      const isAvailabilityOnlyUpdate = 
        updatedFields.length === 1 && 
        updatedFields[0] === 'available';
      
      if (!isAvailabilityOnlyUpdate && book.ownerId.toString() !== command.userId.toString()) {
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

      console.log(`✓ Book updated successfully: ${book._id}`);

      // Populate and emit full book data for read model sync
      const populatedBook = await Book.findById(book._id)
        .populate('ownerId', 'name email')
        .lean();

      eventBus.emit('book.updated', { 
        bookId: book._id, 
        ownerId: book.ownerId,
        title: book.title,
        book: populatedBook // Full book data for read model
      });

      return book;
    } catch (error) {
      console.error('Error in UpdateBookHandler:', error);
      throw error;
    }
  }
}

export default UpdateBookHandler;