// shared/events/listeners/CacheInvalidationListener.js
import eventBus from '../EventBus.js';
import EventTypes from '../EventTypes.js';
import cache from '../../utils/cache.js';

/**
 * CacheInvalidationListener - Invalidates cache in background
 * Listens to domain events and clears relevant cache entries
 */

// Listen for book.created
eventBus.on(EventTypes.BOOK_CREATED, async (data) => {
  try {
    await cache.del('books:page:*');
    await cache.del('search:*');
    console.log('✅ Cache cleared for book.created');
  } catch (error) {
    console.error('❌ Cache invalidation failed for book.created:', error.message);
  }
});

// Listen for book.updated
eventBus.on(EventTypes.BOOK_UPDATED, async (data) => {
  try {
    await cache.del(`book:${data.bookId}`);
    await cache.del('books:page:*');
    await cache.del('search:*');
    console.log(`✅ Cache cleared for book.updated (bookId: ${data.bookId})`);
  } catch (error) {
    console.error('❌ Cache invalidation failed for book.updated:', error.message);
  }
});

// Listen for book.deleted
eventBus.on(EventTypes.BOOK_DELETED, async (data) => {
  try {
    await cache.del(`book:${data.bookId}`);
    await cache.del('books:page:*');
    await cache.del('search:*');
    console.log(`✅ Cache cleared for book.deleted (bookId: ${data.bookId})`);
  } catch (error) {
    console.error('❌ Cache invalidation failed for book.deleted:', error.message);
  }
});

// Listen for borrow.created
eventBus.on(EventTypes.BORROW_CREATED, async (data) => {
  try {
    await cache.del(`book:${data.bookId}`);
    await cache.del('books:page:*');
    console.log(`✅ Cache cleared for borrow.created (bookId: ${data.bookId})`);
  } catch (error) {
    console.error('❌ Cache invalidation failed for borrow.created:', error.message);
  }
});

// Listen for borrow.returned
eventBus.on(EventTypes.BORROW_RETURNED, async (data) => {
  try {
    await cache.del(`book:${data.bookId}`);
    await cache.del('books:page:*');
    console.log(`✅ Cache cleared for borrow.returned (bookId: ${data.bookId})`);
  } catch (error) {
    console.error('❌ Cache invalidation failed for borrow.returned:', error.message);
  }
});

console.log('👂 CacheInvalidationListener registered for book and borrow events');
