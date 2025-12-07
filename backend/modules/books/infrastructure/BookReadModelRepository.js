import redisClient from '../../../shared/utils/redisClient.js';

/**
 * BookReadModelRepository - Redis-based read-optimized storage
 * Part of TRUE CQRS: Read DB (Redis) separate from Write DB (MongoDB)
 * 
 * Performance: ~2-5ms vs MongoDB's 140ms (28x faster)
 */
class BookReadModelRepository {
  constructor() {
    this.keyPrefix = 'readmodel:book';
    this.listKey = 'readmodel:books:all';
    this.searchPrefix = 'readmodel:books:search';
    this.userBooksPrefix = 'readmodel:books:user';
    this.ttl = 3600; // 1 hour TTL
  }

  /**
   * Save denormalized book to Redis (called by event listeners)
   */
  async saveBook(bookData) {
    try {
      const bookKey = `${this.keyPrefix}:${bookData._id}`;
      
      // Extract owner info properly (handle both populated and non-populated)
      let ownerInfo = null;
      if (bookData.ownerId) {
        if (typeof bookData.ownerId === 'object' && bookData.ownerId._id) {
          // Owner is populated (from MongoDB with .populate())
          ownerInfo = {
            _id: bookData.ownerId._id.toString(),
            name: bookData.ownerId.name || 'Unknown',
            email: bookData.ownerId.email || ''
          };
        } else if (typeof bookData.ownerId === 'string') {
          // Owner is just ID string (not populated)
          ownerInfo = {
            _id: bookData.ownerId,
            name: 'Unknown',
            email: ''
          };
        } else {
          // Owner is ObjectId
          ownerInfo = {
            _id: bookData.ownerId.toString(),
            name: 'Unknown',
            email: ''
          };
        }
      }
      
      // Store denormalized book with MongoDB-compatible structure
      const denormalizedBook = {
        _id: bookData._id.toString(),
        title: bookData.title,
        authors: bookData.authors || [],
        description: bookData.description || '',
        thumbnail: bookData.thumbnail || '',
        available: bookData.available !== undefined ? bookData.available : true,
        categories: bookData.categories || [],
        googleBookId: bookData.googleBookId || null,
        ownerId: ownerInfo, // Store as ownerId to match MongoDB schema
        createdAt: bookData.createdAt,
        updatedAt: bookData.updatedAt
      };

      await redisClient.setex(
        bookKey,
        this.ttl,
        JSON.stringify(denormalizedBook)
      );

      // Add to sorted set for listing (sorted by createdAt)
      const timestamp = new Date(bookData.createdAt).getTime();
      await redisClient.zadd(this.listKey, timestamp, bookData._id.toString());

      // Index by owner for "my books" queries
      if (bookData.ownerId) {
        const ownerId = bookData.ownerId._id?.toString() || bookData.ownerId.toString();
        const userBooksKey = `${this.userBooksPrefix}:${ownerId}`;
        await redisClient.zadd(userBooksKey, timestamp, bookData._id.toString());
        await redisClient.expire(userBooksKey, this.ttl);
      }

      console.log(`✅ Read model saved: ${bookData._id}`);
      return true;
    } catch (error) {
      console.error('❌ Error saving read model:', error);
      return false;
    }
  }

  /**
   * Get book by ID from Redis
   */
  async getBookById(bookId) {
    try {
      const bookKey = `${this.keyPrefix}:${bookId}`;
      const data = await redisClient.get(bookKey);
      
      if (!data) {
        console.log(`⚠️ Read model MISS: ${bookId}`);
        return null;
      }

      console.log(`✅ Read model HIT: ${bookId}`);
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error getting read model:', error);
      return null;
    }
  }

  /**
   * Get all books with pagination (from sorted set)
   */
  async getAllBooks(page = 1, limit = 12) {
    try {
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      // Get book IDs from sorted set (newest first)
      const bookIds = await redisClient.zrevrange(this.listKey, start, end);
      
      if (bookIds.length === 0) {
        console.log('⚠️ Read model empty');
        return { books: [], total: 0 };
      }

      // Get total count
      const total = await redisClient.zcard(this.listKey);

      // Fetch all books in parallel
      const bookKeys = bookIds.map(id => `${this.keyPrefix}:${id}`);
      const booksData = await redisClient.mget(bookKeys);

      const books = booksData
        .filter(data => data !== null)
        .map(data => JSON.parse(data));

      console.log(`✅ Read model: Retrieved ${books.length} books (page ${page})`);

      return {
        books,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      };
    } catch (error) {
      console.error('❌ Error getting all books:', error);
      return { books: [], total: 0 };
    }
  }

  /**
   * Get books by owner ID
   */
  async getBooksByOwner(ownerId, page = 1, limit = 12) {
    try {
      const userBooksKey = `${this.userBooksPrefix}:${ownerId}`;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      // Get book IDs from user's sorted set
      const bookIds = await redisClient.zrevrange(userBooksKey, start, end);
      
      if (bookIds.length === 0) {
        return { books: [], total: 0 };
      }

      const total = await redisClient.zcard(userBooksKey);

      // Fetch books
      const bookKeys = bookIds.map(id => `${this.keyPrefix}:${id}`);
      const booksData = await redisClient.mget(bookKeys);

      const books = booksData
        .filter(data => data !== null)
        .map(data => JSON.parse(data));

      console.log(`✅ Read model: Retrieved ${books.length} books for user ${ownerId}`);

      return {
        books,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      };
    } catch (error) {
      console.error('❌ Error getting user books:', error);
      return { books: [], total: 0 };
    }
  }

  /**
   * Search books (simple prefix match on title)
   */
  async searchBooks(query, page = 1, limit = 12) {
    try {
      const searchKey = `${this.searchPrefix}:${query.toLowerCase()}`;
      
      // Check if search result is cached
      const cached = await redisClient.get(searchKey);
      if (cached) {
        const result = JSON.parse(cached);
        console.log(`✅ Search cache HIT: ${query}`);
        return result;
      }

      // If not cached, get all books and filter (fallback)
      const allBooks = await this.getAllBooks(1, 1000); // Get more for search
      const filtered = allBooks.books.filter(book => 
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.authors.some(author => author.toLowerCase().includes(query.toLowerCase()))
      );

      const start = (page - 1) * limit;
      const paginatedBooks = filtered.slice(start, start + limit);

      const result = {
        books: paginatedBooks,
        total: filtered.length,
        currentPage: page,
        totalPages: Math.ceil(filtered.length / limit)
      };

      // Cache search result for 5 minutes
      await redisClient.setex(searchKey, 300, JSON.stringify(result));

      console.log(`✅ Search completed: ${query} (${filtered.length} results)`);
      return result;
    } catch (error) {
      console.error('❌ Error searching books:', error);
      return { books: [], total: 0 };
    }
  }

  /**
   * Delete book from Redis
   */
  async deleteBook(bookId) {
    try {
      const bookKey = `${this.keyPrefix}:${bookId}`;
      
      // Get book data before deleting to remove from sets
      const bookData = await this.getBookById(bookId);
      
      // Delete book key
      await redisClient.del(bookKey);

      // Remove from all books list
      await redisClient.zrem(this.listKey, bookId);

      // Remove from user's books if owner exists
      if (bookData && bookData.ownerId) {
        const ownerId = bookData.ownerId._id || bookData.ownerId;
        const userBooksKey = `${this.userBooksPrefix}:${ownerId}`;
        await redisClient.zrem(userBooksKey, bookId);
      }

      console.log(`✅ Read model deleted: ${bookId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting read model:', error);
      return false;
    }
  }

  /**
   * Invalidate all search caches
   */
  async invalidateSearchCache() {
    try {
      const keys = await redisClient.keys(`${this.searchPrefix}:*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`✅ Invalidated ${keys.length} search caches`);
      }
    } catch (error) {
      console.error('❌ Error invalidating search cache:', error);
    }
  }

  /**
   * Rebuild entire read model from MongoDB (for sync)
   * CRITICAL: Clears all existing read model data before rebuilding
   */
  async rebuildFromSource(books) {
    try {
      console.log(`🔄 Rebuilding read model with ${books.length} books...`);
      
      // CRITICAL FIX: Clear all existing read model data first
      console.log('🧹 Clearing existing read model data...');
      
      // Delete all book keys
      const bookKeys = await redisClient.keys(`${this.keyPrefix}:*`);
      if (bookKeys.length > 0) {
        await redisClient.del(...bookKeys);
        console.log(`   Deleted ${bookKeys.length} book keys`);
      }
      
      // Delete all books list
      await redisClient.del(this.listKey);
      console.log(`   Deleted books list: ${this.listKey}`);
      
      // Delete all user books indexes
      const userBooksKeys = await redisClient.keys(`${this.userBooksPrefix}:*`);
      if (userBooksKeys.length > 0) {
        await redisClient.del(...userBooksKeys);
        console.log(`   Deleted ${userBooksKeys.length} user books indexes`);
      }
      
      // Delete all search caches
      await this.invalidateSearchCache();
      
      console.log('✅ Existing read model cleared');
      
      // Now rebuild with fresh data
      for (const book of books) {
        await this.saveBook(book);
      }
      
      console.log('✅ Read model rebuild complete');
      return true;
    } catch (error) {
      console.error('❌ Error rebuilding read model:', error);
      return false;
    }
  }
}

export default new BookReadModelRepository();
