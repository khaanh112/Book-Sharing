// modules/books/infrastructure/BookRepository.js
import Book from '../domain/Book.model.js';

class BookRepository {
  /**
   * Find book by ID
   */
  async findById(bookId) {
    return await Book.findById(bookId).lean();
  }

  /**
   * Find book by ID with owner populated
   */
  async findByIdWithOwner(bookId) {
    return await Book.findById(bookId)
      .populate('ownerId', 'name email')
      .lean();
  }

  /**
   * Find all books with filters
   */
  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 12 } = options;
    const skip = (page - 1) * limit;

    const books = await Book.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('ownerId', 'name email')
      .lean();

    const total = await Book.countDocuments(filters);

    return {
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create a new book
   */
  async create(bookData) {
    const book = new Book(bookData);
    return await book.save();
  }

  /**
   * Update book
   */
  async update(bookId, updateData) {
    return await Book.findByIdAndUpdate(
      bookId,
      updateData,
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete book
   */
  async delete(bookId) {
    return await Book.findByIdAndDelete(bookId);
  }

  /**
   * Update book availability
   */
  async updateAvailability(bookId, available) {
    return await Book.findByIdAndUpdate(
      bookId,
      { available },
      { new: true }
    );
  }

  /**
   * Search books by text
   */
  async search(keyword, options = {}) {
    const { page = 1, limit = 12 } = options;
    const skip = (page - 1) * limit;

    const books = await Book.find({
      $text: { $search: keyword }
    })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .populate('ownerId', 'name email')
      .lean();

    const total = await Book.countDocuments({
      $text: { $search: keyword }
    });

    return {
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find books by owner
   */
  async findByOwner(ownerId, options = {}) {
    return await this.findAll({ ownerId }, options);
  }
}

export default BookRepository;
