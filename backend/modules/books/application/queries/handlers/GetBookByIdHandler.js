import Book from '../../../domain/Book.model.js';
import bookReadModel from '../../../infrastructure/BookReadModelRepository.js';

/**
 * GetBookByIdHandler - Handles GetBookByIdQuery
 * TRUE CQRS: Reads from Redis Read Model with MongoDB fallback
 */
class GetBookByIdHandler {
  /**
   * Handle the GetBookByIdQuery
   * @param {GetBookByIdQuery} query - The query to handle
   * @returns {Promise<object>} The book data
   */
  async handle(query) {
    // Validate query
    query.validate();

    try {
      // TRUE CQRS: Try Redis Read Model first (2-5ms)
      console.log(`🔍 Reading book ${query.bookId} from Redis...`);
      const book = await bookReadModel.getBookById(query.bookId);
      
      if (book) {
        console.log(`⚡ Read Model HIT: ${query.bookId}`);
        return book;
      }

      // Fallback to MongoDB
      console.log(`⚠️ Read Model MISS - fallback to MongoDB: ${query.bookId}`);
      const bookFromDb = await Book.findById(query.bookId)
        .populate('ownerId', 'name email')
        .select('title authors description thumbnail ownerId available categories googleBookId createdAt updatedAt')
        .lean();

      if (!bookFromDb) {
        throw new Error('Book not found');
      }

      // Sync to read model for next time (async, don't await)
      bookReadModel.saveBook(bookFromDb).catch(err => 
        console.error('Failed to sync book to read model:', err)
      );

      return bookFromDb;
    } catch (error) {
      console.error('Error in GetBookByIdHandler:', error);
      throw error;
    }
  }
}

export default GetBookByIdHandler;