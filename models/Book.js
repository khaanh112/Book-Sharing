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

export default mongoose.model("Book", bookSchema);
