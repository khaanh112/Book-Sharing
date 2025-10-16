import Book from "../models/Book.js";
import mongoose from "mongoose";
import { searchGoogleBooks, } from "../utils/googleBooks.js";
import cloudinary from "../config/cloudinary.js";
import upload from "../middlewares/uploadCloudinary.js";


/*
 * Get all books in DB
 */


const getAllBooks = async (req, res) => {
  const { q, authors, category, available } = req.query; 
  const filter = {}; 
  if (q) { 
  filter.$or = [ { title: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }, ]; 
  } 
  
  if (authors) { filter.authors = { $regex: authors, $options: "i" }; } 
  if (category) { filter.categories = category; } 
  if (available !== undefined) { filter.available = available === "true"; } 
  try { 
  const books = await Book.find(filter).populate('ownerId', 'name');
    res.status(200).json(books);
  } catch (err) { 
    res.status(500).json({ message: "Server error" }); 
}};


/**
 * Get books owned by current user
 */
const getMyBooks = async (req, res) => {
  const ownerId = req.user.id;
  const books = await Book.find({ ownerId });
  res.status(200).json(books);
};

/**
 * Get single book by id
 */


const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    // Populate để lấy name (và email nếu muốn)
    const book = await Book.findById(id).populate("ownerId", "name");

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).json({ message: "Server error" });
  }
};




const searchBooks = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: "Missing search query" });
  }

  try {
    const data = await searchGoogleBooks(q);

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
        thumbnail: volumeInfo.imageLinks?.thumbnail || null, // chỉ lưu URL
        ownerId: null,
        available: true,
        categories: volumeInfo.categories || [],
        googleBookId: item.id,
      };
    });

    res.status(200).json(books);
  } catch (err) {
    console.error("Google Books search error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create new book
 */
const createBook = async (req, res) => {
  try {
    const starttime = Date.now();

    const { title, authors, category, description, thumbnail } = req.body;
    const ownerId = req.user?.id;

    if (!title || !authors) {
      console.warn("⚠️ Missing required fields:", { title, authors });
      return res.status(400).json({ message: "Title and author are required" });
    }

    let thumbnailUrl = null;

    // Trường hợp 1: upload file
    if (req.file) {

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "book_thumbnails",
      });
      thumbnailUrl = result.secure_url;
    }

    // Trường hợp 2: truyền sẵn URL (Google Books)
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
    res.status(201).json(newBook);

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


/**
 * Update book
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
      ...(thumbnailUrl ? { thumbnail: thumbnailUrl } : {}), // chỉ update nếu có URL mới
    },
    { new: true }
  );

  if (!updatedBook) {
    return res.status(404).json({ message: "Book not found" });
  }

  res.status(200).json(updatedBook);
};
/**
 * Delete book
 */
const deleteBook = async (req, res) => {
  const { id } = req.params;
  const deletedBook = await Book.findByIdAndDelete(id);

  if (!deletedBook) {
    return res.status(404).json({ message: "Book not found" });
  }

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
