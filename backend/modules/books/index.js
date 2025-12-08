// modules/books/index.js
// Public API for Books Module

import BookService from './domain/BookService.js';
import BookRepository from './infrastructure/BookRepository.js';
import bookRoutes from './interface/BookRoutes.js';
import './infrastructure/BooksModuleListener.js'; // Event-driven communication

// Initialize repository and service
const bookRepository = new BookRepository();
const bookService = new BookService(bookRepository);

// Event types this module publishes
const BookEvents = {
  BOOK_CREATED: 'book.created',
  BOOK_UPDATED: 'book.updated',
  BOOK_DELETED: 'book.deleted'
};

// Public API - only expose what other modules need
export {
  bookService,
  bookRepository,
  bookRoutes,
  BookEvents
};

export default {
  service: bookService,
  repository: bookRepository,
  routes: bookRoutes,
  events: BookEvents
};
