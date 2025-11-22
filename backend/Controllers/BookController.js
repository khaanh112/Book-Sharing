import Book from "../models/Book.js";
import mongoose from "mongoose";
import { searchGoogleBooks, } from "../utils/googleBooks.js";
import cloudinary from "../config/cloudinary.js";
import upload from "../middlewares/uploadCloudinary.js";
import cache from "../utils/cache.js";


/**
 * Get all books with optional filters
 * Uses cache when no filters applied
 */
const getAllBooks = async (req, res) => {
  const { q, authors, category, available, page = 1 } = req.query;

  const filter = {};

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  if (authors) {
    filter.authors = { $regex: authors, $options: "i" };
  }

  if (category) {
    filter.categories = category;
  }

  if (available !== undefined) {
    filter.available = available === "true";
  }

  // Luôn 12 items/trang
  const limitNum = 12;
  const pageNum = parseInt(page, 10);      // Số trang hiện tại
  const skip = (pageNum - 1) * limitNum;   // Bỏ qua số phần tử của trang trước đó

  const isFiltered = Object.keys(filter).length > 0;

  try {
    // Nếu có filter → không dùng cache
    if (isFiltered) {
      const [books, total] = await Promise.all([
        Book.find(filter)
          .skip(skip)
          .limit(limitNum)
          .populate('ownerId', 'name'),

        Book.countDocuments(filter)
      ]);

      return res.status(200).json({
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        data: books,
      });
    }

    /* 
    Redis cache

    const cacheKey = `books:all:page=${pageNum}:limit=${limitNum}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      console.log("Serving paginated data from cache");
      return res.status(200).json(JSON.parse(cached));
    }
    */

    // Không filter → lấy trực tiếp từ DB (không cache)
    const [books, total] = await Promise.all([
      Book.find({})
        .skip(skip)
        .limit(limitNum)
        .populate('ownerId', 'name'),

      Book.countDocuments({})
    ]);

    const responseData = {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: books,
    };

    /*
    Lưu cache

    await redisClient.set(cacheKey, JSON.stringify(responseData), "EX", 300);
    console.log("Serving paginated data from DB and cached");
    */

    return res.status(200).json(responseData);

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
 */
const getMyBooks = async (req, res) => {
  const ownerId = req.user.id;
  const books = await Book.find({ ownerId });
  res.status(200).json(books);
};

/**
 * Get single book by ID with caching
 */
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const cacheKey = `book:${id}`;
    const book = await cache.getOrSetJSON(cacheKey, 300, async () => {
      return await Book.findById(id).populate("ownerId", "name");
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};




/**
 * Search books from Google Books API with caching
 */
const searchBooks = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: "Missing search query" });
  }

  try {
    const cacheKey = `google:search:${q}`;
    const data = await cache.getOrSetJSON(cacheKey, 300, async () => {
      return await searchGoogleBooks(q);
    });

    const books = (data.items || []).map((item) => {
      const volumeInfo = item.volumeInfo;

      return {
        title: volumeInfo.title || "No title",
        authors: volumeInfo.authors 
          ? (volumeInfo.authors.length > 3 
              ? volumeInfo.authors.slice(0, 3).join(", ") + " et al." 
              : volumeInfo.authors.join(", "))
          : (volumeInfo.publisher || volumeInfo.subtitle || "Unknown author"),
        description: volumeInfo.description || "No description",
        thumbnail: volumeInfo.imageLinks?.thumbnail || null,
        ownerId: null,
        available: true,
        categories: volumeInfo.categories || [],
        googleBookId: item.id,
      };
    });

    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create new book
 */
const createBook = async (req, res) => {
  try {
    const { title, authors, category, description, thumbnail } = req.body;
    const ownerId = req.user?.id;

    if (!title || !authors) {
      return res.status(400).json({ message: "Title and author are required" });
    }

    let thumbnailUrl = null;

    // Case 1: File upload
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "book_thumbnails",
      });
      thumbnailUrl = result.secure_url;
    }
    // Case 2: URL provided (Google Books)
    else if (thumbnail) { 
      thumbnailUrl = thumbnail;
    }

    const newBook = new Book({
      title,
      authors,
      categories: category ? [category] : [],
      description,
      ownerId,
      thumbnail: thumbnailUrl,
    });

    await newBook.save();
    
    // Invalidate cache
    await cache.del('books:all');
    await cache.del(`book:${newBook._id}`);
    
    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


/**
 * Update book and invalidate cache
 */
const updateBook = async (req, res) => {
  const { id } = req.params;
  const { title, authors, description, available, categories, thumbnailUrl } = req.body;

  const updatedBook = await Book.findByIdAndUpdate(
    id,
    {
      title,
      authors,
      description,
      available,
      categories,
      ...(thumbnailUrl ? { thumbnail: thumbnailUrl } : {}),
    },
    { new: true }
  );

  if (!updatedBook) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Invalidate cache
  await cache.del('books:all');
  await cache.del(`book:${id}`);
  
  res.status(200).json(updatedBook);
};

/**
 * Delete book and invalidate cache
 */
const deleteBook = async (req, res) => {
  const { id } = req.params;
  const deletedBook = await Book.findByIdAndDelete(id);

  if (!deletedBook) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Invalidate cache
  await cache.del('books:all');
  await cache.del(`book:${id}`);
  
  res.status(200).json({
    message: "Book deleted successfully",
    book: deletedBook,
  });
};

export {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getMyBooks,
  searchBooks,
};
