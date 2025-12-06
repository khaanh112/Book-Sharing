// models/Book.js
import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    authors: [{ type: String, required: true }],
    description: { type: String },
    thumbnail: { type: String},
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    available: { type: Boolean, default: true },
    categories: [{ type: String }],
    googleBookId: { type: String }
  },
  { timestamps: true }
);

// Text index for fast search on title, authors, and description
bookSchema.index({ 
  title: 'text', 
  authors: 'text', 
  description: 'text' 
});

// Compound index for filtering by availability and categories
bookSchema.index({ available: 1, categories: 1 });

// Index for owner queries
bookSchema.index({ ownerId: 1, available: 1 });

// Prevent OverwriteModelError
export default mongoose.models.Book || mongoose.model("Book", bookSchema);
