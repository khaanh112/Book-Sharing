import Review from "../models/Review.js";

// Tạo review mới
export const createReview = async (req, res) => {
  const { bookId, rating, comment } = req.body;

  if (!bookId || !rating) {
    res.status(400);
    throw new Error("Book ID and rating are required");
  }

  const review = await Review.create({
    bookId,
    reviewerId: req.user._id,
    rating,
    comment
  });

  res.status(201).json(review);
};

// Lấy danh sách review (filter theo query)
export const getReviews = async (req, res) => {
  const { bookId, userId } = req.query;
  const filter = {};
  if (bookId) filter.bookId = bookId;
  if (userId) filter.reviewerId = userId;

  const reviews = await Review.find(filter)
    .populate("reviewerId", "name email")
    .populate("bookId", "title");

  res.json(reviews);
};

// Lấy chi tiết review
export const getReviewById = async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate("reviewerId", "name email")
    .populate("bookId", "title");

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  res.json(review);
};

// Update review
export const updateReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found" });

  if (review.reviewerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Bạn không có quyền sửa review này");
  }

  const { rating, comment } = req.body;
  review.rating = rating ?? review.rating;
  review.comment = comment ?? review.comment;

  await review.save();
  res.json(review);
};

// Xóa review
export const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found" });

  if (review.reviewerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Bạn không có quyền xóa review này");
  }

  await review.deleteOne();
  res.json({ message: "Review deleted" });
};
