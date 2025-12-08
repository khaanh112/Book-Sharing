// modules/borrowing/index.js
import BorrowService from './domain/BorrowService.js';
import BorrowRepository from './infrastructure/BorrowRepository.js';
import borrowRoutes from './interface/BorrowRoutes.js';
import './infrastructure/BorrowingModuleListener.js'; // Event-driven communication

// Initialize repository and service
const borrowRepository = new BorrowRepository();
const borrowService = new BorrowService(borrowRepository);

// Event types this module publishes
const BorrowEvents = {
  BORROW_CREATED: 'borrow.created',
  BORROW_APPROVED: 'borrow.approved',
  BORROW_REJECTED: 'borrow.rejected',
  BORROW_RETURNED: 'borrow.returned'
};

export {
  borrowService,
  borrowRepository,
  borrowRoutes,
  BorrowEvents
};

export default {
  service: borrowService,
  repository: borrowRepository,
  routes: borrowRoutes,
  events: BorrowEvents
};
