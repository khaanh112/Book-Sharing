import Book from "../domain/Book.model.js";
import mongoose from "mongoose";
import { searchGoogleBooks, } from "../../../shared/utils/googleBooks.js";
import cloudinary from "../../../config/cloudinary.js";
import upload from "../../../shared/middlewares/uploadCloudinary.js";
import cache from "../../../shared/utils/cache.js";

// CQRS imports
import { commandBus, queryBus } from "../../../cqrs/bootstrap.js";
import CreateBookCommand from "../application/commands/CreateBookCommand.js";
import UpdateBookCommand from "../application/commands/UpdateBookCommand.js";
import DeleteBookCommand from "../application/commands/DeleteBookCommand.js";
import GetAllBooksQuery from "../application/queries/GetAllBooksQuery.js";
import GetBookByIdQuery from "../application/queries/GetBookByIdQuery.js";
import GetMyBooksQuery from "../application/queries/GetMyBooksQuery.js";
import SearchBooksQuery from "../application/queries/SearchBooksQuery.js";


/**
 * Get all books with optional filters
 * Uses CQRS Query Pattern with cache
 */
const getAllBooks = async (req, res) => {
  try {
    const { q, authors, category, available, page = 1 } = req.query;

    const query = new GetAllBooksQuery({
      q,
      authors,
      category,
      available: available === "true" ? true : available === "false" ? false : undefined,
      page: parseInt(page, 10),
      limit: 12
    });

    const result = await queryBus.execute(query);

    return res.status(200).json(result);

  } catch (err) {
    console.error("getAllBooks ERROR:", err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};




/**
 * Get books owned by current user
 * Uses CQRS Query Pattern with cache
 */
const getMyBooks = async (req, res) => {
  try {
    const ownerId = req.user.id;
    
    const query = new GetMyBooksQuery({
      userId: ownerId,
      available: req.query.available === "true" ? true : req.query.available === "false" ? false : undefined,
      page: parseInt(req.query.page || 1, 10),
      limit: 12
    });

    const result = await queryBus.execute(query);
    res.status(200).json(result);
  } catch (error) {
    console.error("getMyBooks ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get single book by ID with caching
 * Uses CQRS Query Pattern
 */
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const query = new GetBookByIdQuery({
      bookId: id,
      userId: req.user?.id // Optional for personalization
    });

    const book = await queryBus.execute(query);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error("getBookById ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




/**
 * Search books in local database
 * Uses CQRS Query Pattern for local DB search
 */
const searchBooks = async (req, res) => {
  const { q, sort = 'relevance' } = req.query;
  if (!q) {
    return res.status(400).json({ message: "Missing search query" });
  }

  try {
    // Use CQRS for local database search
    const query = new SearchBooksQuery({
      searchTerm: q,
      sort,
      page: parseInt(req.query.page || 1, 10),
      limit: 12
    });

    const result = await queryBus.execute(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("searchBooks ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Search books from Google Books API
 * External API call for adding books from Google Books
 */
const searchGoogleBooksAPI = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: "Missing search query" });
  }

  try {
    const data = await searchGoogleBooks(q);
    
    // Transform Google Books response to our format
    const books = data.items?.map(item => ({
      googleBookId: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors?.join(", ") || "Unknown",
      categories: item.volumeInfo.categories || [],
      description: item.volumeInfo.description || "",
      thumbnail: item.volumeInfo.imageLinks?.thumbnail || null,
      publishedDate: item.volumeInfo.publishedDate
    })) || [];

    res.status(200).json({ books });
  } catch (err) {
    console.error("searchGoogleBooksAPI ERROR:", err);
    res.status(500).json({ message: "Failed to search Google Books", error: err.message });
  }
};

/**
 * Create new book
 * Uses CQRS Command Pattern
 * Supports both file upload and URL-based thumbnails
 */
const createBook = async (req, res) => {
  try {
    const { title, authors, category, description, thumbnail } = req.body;
    const ownerId = req.user?.id;

    if (!title || !authors) {
      return res.status(400).json({ message: "Title and author are required" });
    }

    let thumbnailUrl = null;

    // Case 1: File upload via multer (buffer in memory)
    if (req.file && req.file.buffer) {
      // Upload buffer to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { folder: "book_thumbnails" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      thumbnailUrl = uploadResult.secure_url;
    }
    // Case 2: URL provided (Google Books or manual entry)
    else if (thumbnail) { 
      thumbnailUrl = thumbnail;
    }

    const command = new CreateBookCommand({
      title,
      authors,
      categories: category ? [category] : [],
      description,
      ownerId,
      thumbnail: thumbnailUrl,
    });

    const newBook = await commandBus.execute(command);
    
    res.status(201).json(newBook);
  } catch (err) {
    console.error("createBook ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


/**
 * Update book and invalidate cache
 * Uses CQRS Command Pattern
 */
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, authors, description, available, categories, thumbnailUrl } = req.body;
    const userId = req.user?.id;

    const command = new UpdateBookCommand({
      bookId: id,
      userId,
      updates: {
        title,
        authors,
        description,
        available,
        categories,
        ...(thumbnailUrl ? { thumbnail: thumbnailUrl } : {}),
      }
    });

    const updatedBook = await commandBus.execute(command);

    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json(updatedBook);
  } catch (err) {
    console.error("updateBook ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Delete book and invalidate cache
 * Uses CQRS Command Pattern
 */
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const command = new DeleteBookCommand({
      bookId: id,
      userId
    });

    const deletedBook = await commandBus.execute(command);

    if (!deletedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({
      message: "Book deleted successfully",
      book: deletedBook,
    });
  } catch (err) {
    console.error("deleteBook ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getMyBooks,
  searchBooks,
  searchGoogleBooksAPI,
};
