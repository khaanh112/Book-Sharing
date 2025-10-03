// models/Borrow.js
import e from 'express';
import mongoose from 'mongoose';

const borrowSchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "returned", "overdue", "revoked"],
      default: "pending"
    },
    requestDate: { type: Date, default: Date.now },
    returnDate: { type: Date },
    dueDate: { type: Date }
  },
  { timestamps: true }
);

// Compound index để ngăn duplicate pending requests
// User không thể tạo nhiều pending request cho cùng 1 sách
borrowSchema.index(
  { bookId: 1, borrowerId: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: "pending" }
  }
);

export default mongoose.model("Borrow", borrowSchema);
