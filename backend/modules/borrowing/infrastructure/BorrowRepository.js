// modules/borrowing/infrastructure/BorrowRepository.js
import Borrow from '../domain/Borrow.model.js';

class BorrowRepository {
  /**
   * Create a new borrow
   */
  async create(borrowData) {
    const borrow = new Borrow(borrowData);
    return await borrow.save();
  }

  /**
   * Find borrow by ID
   */
  async findById(borrowId) {
    return await Borrow.findById(borrowId)
      .populate('bookId', 'title authors')
      .populate('borrowerId', 'name email')
      .populate('ownerId', 'name email')
      .lean();
  }

  /**
   * Find all borrows with filters
   */
  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const borrows = await Borrow.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('bookId', 'title authors thumbnail')
      .populate('borrowerId', 'name email')
      .populate('ownerId', 'name email')
      .lean();

    const total = await Borrow.countDocuments(filters);

    return {
      borrows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update borrow status
   */
  async updateStatus(borrowId, status) {
    return await Borrow.findByIdAndUpdate(
      borrowId,
      { status },
      { new: true }
    );
  }

  /**
   * Find active borrow for user and book
   */
  async findActiveBorrow(userId, bookId) {
    return await Borrow.findOne({
      borrowerId: userId,
      bookId: bookId,
      status: { $in: ['pending', 'approved'] }
    });
  }

  /**
   * Find borrows by borrower
   */
  async findByBorrower(borrowerId, options = {}) {
    return await this.findAll({ borrowerId }, options);
  }

  /**
   * Find borrows by owner
   */
  async findByOwner(ownerId, options = {}) {
    return await this.findAll({ ownerId }, options);
  }

  /**
   * Delete borrow
   */
  async delete(borrowId) {
    return await Borrow.findByIdAndDelete(borrowId);
  }
}

export default BorrowRepository;
