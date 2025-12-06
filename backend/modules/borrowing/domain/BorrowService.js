// modules/borrowing/domain/BorrowService.js
import eventBus from '../../../shared/events/EventBus.js';
import EventTypes from '../../../shared/events/EventTypes.js';

class BorrowService {
  constructor(borrowRepository) {
    this.borrowRepository = borrowRepository;
  }

  /**
   * Create a new borrow request
   */
  async createBorrowRequest(borrowData) {
    const borrow = await this.borrowRepository.create(borrowData);
    
    // Emit event for async processing
    eventBus.emit(EventTypes.BORROW_CREATED, {
      borrowId: borrow._id,
      bookId: borrow.bookId,
      ownerId: borrow.ownerId,
      borrowerId: borrow.borrowerId
    });
    
    return borrow;
  }

  /**
   * Approve borrow request
   */
  async approveBorrow(borrowId) {
    const borrow = await this.borrowRepository.updateStatus(borrowId, 'approved');
    
    // Emit event
    eventBus.emit(EventTypes.BORROW_APPROVED, {
      borrowId: borrow._id,
      borrowerId: borrow.borrowerId
    });
    
    return borrow;
  }

  /**
   * Reject borrow request
   */
  async rejectBorrow(borrowId, reason) {
    const borrow = await this.borrowRepository.updateStatus(borrowId, 'rejected');
    
    // Emit event
    eventBus.emit(EventTypes.BORROW_REJECTED, {
      borrowId: borrow._id,
      borrowerId: borrow.borrowerId,
      reason
    });
    
    return borrow;
  }

  /**
   * Return book
   */
  async returnBook(borrowId) {
    const borrow = await this.borrowRepository.updateStatus(borrowId, 'returned');
    
    // Emit event
    eventBus.emit(EventTypes.BORROW_RETURNED, {
      borrowId: borrow._id,
      bookId: borrow.bookId,
      borrowerId: borrow.borrowerId
    });
    
    return borrow;
  }

  /**
   * Check if user can borrow book
   */
  async canBorrow(userId, bookId) {
    const activeBorrow = await this.borrowRepository.findActiveBorrow(userId, bookId);
    return !activeBorrow;
  }
}

export default BorrowService;
