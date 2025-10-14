import Borrow from '../models/Borrow.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import { 
  notifyNewBorrowRequest,
  notifyBorrowAccepted,
  notifyBorrowRejected,
  notifyBookReturned
} from '../utils/notificationService.js';

// Tạo yêu cầu mượn sách
const createBorrow = async (req, res) => {
  try {
    const { bookId, dueDate } = req.body;
    const borrowerId = req.user.id;

    if (!bookId || !dueDate) {
      return res.status(400).json({
        status: "error",
        message: "Book ID and due date are required",
      });
    }

    // Kiểm tra sách tồn tại và còn available
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        status: "error",
        message: "Book not found",
      });
    }
    if (!book.available) {
      return res.status(400).json({
        status: "error",
        message: "Book is not available",
      });
    }

    // Không cho mượn sách của chính mình
    if (String(book.ownerId) === String(borrowerId)) {
      return res.status(403).json({
        status: "error",
        message: "You cannot borrow your own book",
      });
    }

    // Kiểm tra xem đã có pending request cho sách này chưa
    const existingPendingRequest = await Borrow.findOne({
      bookId,
      borrowerId,
      status: "pending"
    });
    
    if (existingPendingRequest) {
      return res.status(400).json({
        status: "error",
        message: "You already have a pending request for this book",
      });
    }

    // Tạo yêu cầu mượn
    const borrow = await Borrow.create({
      bookId,
      borrowerId,
      ownerId: book.ownerId,
      dueDate: Date.now() + dueDate * 24 * 60 * 60 * 1000, 
      status: "pending",
    });

    // Lấy thông tin borrower và gửi notification cho owner
    const borrower = await User.findById(borrowerId);
    notifyNewBorrowRequest(
      book.ownerId,
      borrower.name,
      book.title,
      borrow._id
    ).catch(err => console.error('Notification error:', err));

    return res.status(201).json({
      status: "success",
      message: "Borrow request created successfully",
      borrow,
    });
  } catch (err) {
    console.error("Error in createBorrow:", err);
    
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "You already have a pending request for this book",
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: err.message || "Internal Server Error",
    });
  }
};


// Chấp nhận yêu cầu mượn
const acceptBorrow = async (req, res) => {
  const { id } = req.params;
  const borrow = await Borrow.findById(id);
  if (!borrow) throw new Error("Borrow request not found");
  if (borrow.status !== "pending") throw new Error("Request is not pending");

  // Chỉ chủ sách mới được chấp nhận
  if (String(borrow.ownerId) !== String(req.user.id)) throw new Error("Not authorized");

  borrow.status = "accepted";
  borrow.returnDate = undefined;
  await borrow.save();

  // Đánh dấu sách không còn available
  await Book.findByIdAndUpdate(borrow.bookId, { available: false });

  // Gửi notification cho borrower
  const owner = await User.findById(borrow.ownerId);
  const book = await Book.findById(borrow.bookId);
  notifyBorrowAccepted(
    borrow.borrowerId,
    owner.name,
    book.title,
    borrow._id
  ).catch(err => console.error('Notification error:', err));

  res.status(200).json({ status: "success", borrow });
};

// Trả sách
const returnBorrow = async (req, res) => {
  const { id } = req.params;
  const borrow = await Borrow.findById(id);
  if (!borrow) throw new Error("Borrow request not found");
  if (borrow.status !== "accepted") throw new Error("Book is not borrowed");

  // Chỉ người mượn mới được trả
  if (String(borrow.borrowerId) !== String(req.user.id)) throw new Error("Not authorized");

  borrow.status = "returned";
  borrow.returnDate = new Date();
  await borrow.save();

  // Đánh dấu sách available lại
  await Book.findByIdAndUpdate(borrow.bookId, { available: true });

  // Gửi notification cho owner
  const borrower = await User.findById(borrow.borrowerId);
  const book = await Book.findById(borrow.bookId);
  notifyBookReturned(
    borrow.ownerId,
    borrower.name,
    book.title,
    borrow._id
  ).catch(err => console.error('Notification error:', err));

  res.status(200).json({ status: "success", borrow });
};

// Từ chối yêu cầu mượn
const rejectBorrow = async (req, res) => {
  const { id } = req.params;
  const borrow = await Borrow.findById(id);
  if (!borrow) throw new Error("Borrow request not found");
  if (borrow.status !== "pending") throw new Error("Request is not pending");

  // Chỉ chủ sách mới được từ chối
  if (String(borrow.ownerId) !== String(req.user.id)) throw new Error("Not authorized");

  borrow.status = "rejected";
  await borrow.save();

  // Gửi notification cho borrower
  const owner = await User.findById(borrow.ownerId);
  const book = await Book.findById(borrow.bookId);
  notifyBorrowRejected(
    borrow.borrowerId,
    owner.name,
    book.title,
    borrow._id
  ).catch(err => console.error('Notification error:', err));

  res.status(200).json({ status: "success", borrow });
};

// Lấy yêu cầu mượn của chính mình (đã gửi)
const getMyBorrowRequests = async (req, res) => {
  const borrows = await Borrow.find({ borrowerId: req.user.id })
    .populate('bookId ownerId');  // Add ownerId
  res.status(200).json({ status: "success", borrows });
};

// Lấy sách mình đang mượn
const getMyBorrows = async (req, res) => {
  const borrows = await Borrow.find({ 
    borrowerId: req.user.id,
    status: "accepted"  // Only borrowed books
  }).populate('bookId ownerId');
  res.status(200).json({ status: "success", borrows });
};

// Lấy các yêu cầu mượn đang pending (chủ sách xem)
const getPendingRequests = async (req, res) => {
  const borrows = await Borrow.find({ ownerId: req.user.id, status: "pending" }).populate('bookId borrowerId');
  res.status(200).json({ status: "success", borrows });
};

// Lấy chi tiết một yêu cầu mượn
const getBorrowById = async (req, res) => {
  const { id } = req.params;
  const borrow = await Borrow.findById(id).populate('bookId borrowerId ownerId');
  if (!borrow) throw new Error("Borrow request not found");
  res.status(200).json({ status: "success", borrow });
};

// Lấy tất cả yêu cầu mượn (admin)
const getAllBorrows = async (req, res) => {
  const borrows = await Borrow.find().populate('bookId borrowerId ownerId');
  res.status(200).json({ status: "success", borrows });
};

// Xóa yêu cầu mượn (chỉ khi chưa được chấp nhận)
const deleteBorrow = async (req, res) => {
  const { id } = req.params;
  const borrow = await Borrow.findById(id);
  if (!borrow) throw new Error("Borrow request not found");
  if (borrow.status !== "pending") throw new Error("Only pending requests can be deleted");
  if (String(borrow.borrowerId) !== String(req.user.id)) throw new Error("Not authorized");

  await borrow.deleteOne();
  res.status(200).json({ status: "success", message: "Borrow request deleted" });
};

export {
  createBorrow,
  acceptBorrow,
  returnBorrow,
  rejectBorrow,
  getMyBorrowRequests,
  getMyBorrows,
  getPendingRequests,
  getBorrowById,
  getAllBorrows,
  deleteBorrow
};