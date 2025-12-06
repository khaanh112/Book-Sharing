// modules/books/domain/BookService.js
class BookService {
  constructor(bookRepository) {
    this.bookRepository = bookRepository;
  }

  /**
   * Check if book is available for borrowing
   */
  async isBookAvailable(bookId) {
    const book = await this.bookRepository.findById(bookId);
    return book && book.available;
  }

  /**
   * Validate book ownership
   */
  async isOwner(bookId, userId) {
    const book = await this.bookRepository.findById(bookId);
    return book && book.ownerId.toString() === userId.toString();
  }

  /**
   * Reserve a book (mark as unavailable)
   */
  async reserveBook(bookId) {
    return await this.bookRepository.updateAvailability(bookId, false);
  }

  /**
   * Release a book (mark as available)
   */
  async releaseBook(bookId) {
    return await this.bookRepository.updateAvailability(bookId, true);
  }

  /**
   * Validate book data
   */
  validateBookData(bookData) {
    const errors = [];

    if (!bookData.title || bookData.title.trim() === '') {
      errors.push('Title is required');
    }

    if (!bookData.authors || bookData.authors.length === 0) {
      errors.push('At least one author is required');
    }

    if (!bookData.ownerId) {
      errors.push('Owner ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default BookService;
