import React, { useState } from "react";
import { useBorrow } from "../../../context/BorrowContext";
import Loading from "../../../components/Comon/Loading";
import { normalizeAuthors, normalizeUserName } from "../../../utils/bookUtils";
import { showError, showSuccess } from "../../../utils/toastUtils";
const BorrowedBooks = () => {
  const { myBorrows, returnBorrow, loading } = useBorrow();
  const [returningId, setReturningId] = useState(null);

  const handleReturn = async (borrowId) => {
    if (!window.confirm("Are you sure you want to return this book?")) return;

    try {
      setReturningId(borrowId);
      await returnBorrow(borrowId);
      showSuccess("Book returned successfully! 📖");
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to return book";
      showError(errorMsg);
      console.error("Error returning book:", err);
    } finally {
      setReturningId(null);
    }
  };

  if (loading) return <Loading />;

  // Filter only accepted (active) borrows
  const activeBorrows = myBorrows.filter((borrow) => borrow.status === "accepted");
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-[#BE5985] mb-2">
          📖 Borrowed Books
        </h2>
        <p className="text-gray-600">
          Books you're currently borrowing from other users
        </p>
      </div>

      {/* Borrowed Books List */}
      {activeBorrows.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📖</div>
          <p className="text-xl text-gray-600 mb-2">No borrowed books</p>
          <p className="text-gray-500">
            Books you borrow will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeBorrows.map((borrow) => {
            const book = borrow.bookId;
            const owner = borrow.ownerId;
            const isReturning = returningId === borrow._id;
            const dueDate = new Date(borrow.dueDate);
            const today = new Date();
            const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            const isOverdue = daysLeft < 0;

            return (
              <div
                key={borrow._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Book Thumbnail */}
                  <div className="flex-shrink-0">
                    {book?.thumbnail ? (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="w-32 h-44 object-cover rounded-lg shadow"
                      />
                    ) : (
                      <div className="w-32 h-44 bg-[#FFEDFA] flex items-center justify-center rounded-lg">
                        <span className="text-4xl">📚</span>
                      </div>
                    )}
                  </div>

                  {/* Borrow Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-[#BE5985] mb-1">
                        {book?.title || "Unknown Book"}
                      </h3>
                      <p className="text-gray-600">
                        by {normalizeAuthors(book?.authors)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-semibold">👤 Owner:</span>
                        <span>{normalizeUserName(owner)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-semibold">📅 Borrowed:</span>
                        <span>
                          {new Date(borrow.requestDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-semibold">🗓️ Due Date:</span>
                        <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                          {dueDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">⏱️ Time Left:</span>
                        <span
                          className={`font-semibold ${
                            isOverdue
                              ? "text-red-600"
                              : daysLeft <= 3
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {isOverdue
                            ? `${Math.abs(daysLeft)} days overdue!`
                            : `${daysLeft} days left`}
                        </span>
                      </div>
                    </div>

                    {/* Warning for overdue */}
                    {isOverdue && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                        <p className="text-sm text-red-800 font-semibold">
                          ⚠️ This book is overdue! Please return it as soon as possible.
                        </p>
                      </div>
                    )}

                    {/* Warning for soon due */}
                    {!isOverdue && daysLeft <= 3 && daysLeft > 0 && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                        <p className="text-sm text-yellow-800 font-semibold">
                          ⚠️ Due soon! Please prepare to return this book.
                        </p>
                      </div>
                    )}

                    {/* Return Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => handleReturn(borrow._id)}
                        disabled={isReturning}
                        className="px-6 py-2 bg-gradient-to-r from-[#EC7FA9] to-[#BE5985] text-white rounded-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-2"
                      >
                        {isReturning ? (
                          <>⏳ Returning...</>
                        ) : (
                          <>📤 Return Book</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BorrowedBooks;
