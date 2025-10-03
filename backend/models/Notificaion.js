// models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { 
      type: String, 
      enum: [
        "borrow_request_new",      // Yêu cầu mượn sách mới
        "borrow_request_accepted",  // Yêu cầu được chấp nhận
        "borrow_request_rejected",  // Yêu cầu bị từ chối
        "borrow_due_soon",          // Sắp đến hạn trả sách (3 ngày)
        "borrow_overdue",           // Quá hạn trả sách
        "book_returned"             // Sách đã được trả
      ], 
      required: true 
    },
    message: { type: String, required: true },
    title: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // ID của borrow request
    relatedModel: { type: String, enum: ["Borrow", "Book"], default: "Borrow" },
    bookTitle: { type: String }, // Tên sách để hiển thị
    senderName: { type: String } // Tên người gửi notification
  },
  { timestamps: true }
);

// Index để query nhanh
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
