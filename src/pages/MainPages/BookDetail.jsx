import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UseBook } from "../../context/BookContext";
import { useBorrow } from "../../context/BorrowContext";
import BookApi from "../../api/BookApi";
import Loading from "../../components/Comon/Loading";
import { normalizeAuthors, normalizeCategories } from "../../utils/bookUtils";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { books } = UseBook();
  const { createBorrow, myRequests, loading: borrowLoading, clearError, fetchAllBorrowData } = useBorrow();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowDays, setBorrowDays] = useState(7);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch book details và refresh borrow requests
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch book details và refresh borrow requests song song
        const [bookRes] = await Promise.all([
          BookApi.getBookById(id),
          fetchAllBorrowData() // Refresh để đảm bảo có data mới nhất từ DB
        ]);
        setBook(bookRes);
      } catch (err) {
        console.error("Error fetching data:", err);
        setMessage({ text: "Failed to load book details", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Validate requests array
  const safeRequests = Array.isArray(myRequests) ? myRequests : [];

  const alreadyRequested = useMemo(() => {
    return safeRequests.some(
      (req) => {
        // bookId có thể là string hoặc object (populated)
        const requestBookId = typeof req.bookId === 'string' 
          ? req.bookId 
          : req.bookId?._id;
        return requestBookId === id && req.status === "pending";
      }
    );
  }, [safeRequests, id]);

  const isBorrowedByAnyone = useMemo(() => {
    return (
      !book?.available ||
      safeRequests.some(
        (req) => {
          const requestBookId = typeof req.bookId === 'string' 
            ? req.bookId 
            : req.bookId?._id;
          return requestBookId === id && req.status === "approved";
        }
      )
    );
  }, [book, safeRequests, id]);

  // Handle borrow request
  const handleBorrow = async () => {
    // Debug: Log để kiểm tra
    console.log("🔍 Checking borrow request...");
    console.log("myRequests:", myRequests);
    console.log("Current bookId:", id);
    console.log("alreadyRequested:", alreadyRequested);
    
    // Kiểm tra lại xem đã request chưa (double check)
    if (alreadyRequested) {
      setMessage({ 
        text: "You already have a pending request for this book", 
        type: "error" 
      });
      return;
    }

    if (!book?._id) {
      setMessage({ text: "Book information is missing", type: "error" });
      return;
    }

    if (borrowDays < 1 || borrowDays > 30) {
      setMessage({ text: "Please enter days between 1-30", type: "error" });
      return;
    }

    // Kiểm tra sách còn available không
    if (isBorrowedByAnyone) {
      setMessage({ 
        text: "This book is no longer available", 
        type: "error" 
      });
      return;
    }

    // Ngăn double click
    if (isSubmitting) {
      console.log("⚠️ Already submitting, preventing duplicate request");
      return;
    }

    try {
      setIsSubmitting(true);
      clearError();
      
      const result = await createBorrow({ 
        bookId: book._id, 
        dueDate: borrowDays 
      });
      
      if (result?.success) {
        console.log("✅ Borrow request successful:", result);
        setMessage({ 
          text: result.message || "Borrow request sent successfully!", 
          type: "success" 
        });
        // Disable form sau khi gửi thành công
        setBorrowDays(7); // Reset về default
      }
    } catch (err) {
      console.error("❌ Borrow error:", err);
      setMessage({ 
        text: err?.message || "Failed to create borrow request. Please try again.", 
        type: "error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (!book) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl text-[#BE5985] mb-4">📚 Book not found</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-[#EC7FA9] text-white rounded-lg hover:bg-[#BE5985] transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-[#BE5985] hover:text-[#EC7FA9] transition font-semibold"
      >
        ← Back
      </button>

      {/* Book Detail Card */}
      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Book Info Section */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Book Cover */}
            {book.thumbnail ? (
              <img
                src={book.thumbnail}
                alt={book.title}
                className="w-full md:w-64 h-80 object-cover rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full md:w-64 h-80 bg-[#FFEDFA] flex items-center justify-center rounded-lg shadow-lg">
                <span className="text-6xl">📚</span>
              </div>
            )}

            {/* Book Details */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-[#BE5985] mb-4">
                {book.title}
              </h1>
              
              <div className="space-y-3">
                <InfoRow
                  label="Author(s)"
                  value={normalizeAuthors(book.authors)}
                />
                <InfoRow
                  label="Category"
                  value={normalizeCategories(book.categories)}
                />
                <InfoRow
                  label="Owner"
                  value={book.ownerId?.name || "Unknown"}
                />
                <div className="flex items-center">
                  <span className="font-semibold text-gray-700 w-32">Status:</span>
                  {isBorrowedByAnyone ? (
                    <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-semibold">
                      ❌ Borrowed
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-semibold">
                      ✅ Available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#BE5985] mb-3">
                Description
              </h2>
              <p className="text-gray-700 leading-relaxed">{book.description}</p>
            </div>
          )}

          {/* Borrow Section */}
          <div className="border-t pt-6">
            {!isBorrowedByAnyone ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-[#BE5985]">
                  Borrow this book
                </h3>
                
                {alreadyRequested && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">⏳</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800 font-medium">
                          You have a pending borrow request for this book
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Please wait for the owner to approve your request
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-gray-700 font-medium">
                      Duration:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={borrowDays}
                      onChange={(e) => setBorrowDays(Number(e.target.value))}
                      disabled={alreadyRequested}
                      className="w-20 border-2 border-[#FFB8E0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EC7FA9] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-600">day(s)</span>
                  </div>
                  <button
                    onClick={handleBorrow}
                    disabled={alreadyRequested || isSubmitting || borrowLoading}
                    className={`px-6 py-2.5 rounded-lg shadow-lg text-white font-semibold transition-all ${
                      alreadyRequested || isSubmitting || borrowLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#EC7FA9] to-[#BE5985] hover:shadow-xl hover:scale-105 active:scale-95"
                    }`}
                  >
                    {isSubmitting || borrowLoading
                      ? "Processing..."
                      : alreadyRequested
                      ? "✓ Request Sent"
                      : "Send Borrow Request"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 text-lg">
                  📖 This book is currently borrowed and unavailable.
                </p>
              </div>
            )}
          </div>

          {/* Message Display */}
          {message.text && (
            <div
              className={`mt-6 p-4 rounded-lg text-center font-medium ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component for info rows
const InfoRow = ({ label, value }) => (
  <div className="flex items-start">
    <span className="font-semibold text-gray-700 w-32">{label}:</span>
    <span className="text-gray-600 flex-1">{value}</span>
  </div>
);

export default BookDetail;
