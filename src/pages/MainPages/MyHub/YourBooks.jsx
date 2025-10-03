// src/pages/YourBooks.jsx
import React, { useEffect, useState } from "react";
import { UseBook } from "../../../context/BookContext";
import { useBorrow } from "../../../context/BorrowContext";
import bookApi from "../../../api/BookApi";
import Loading from "../../../components/Comon/Loading";
import { normalizeAuthors, normalizeCategories } from "../../../utils/bookUtils";

const YourBooks = () => {
  const { deleteBook, updateBook } = UseBook();
  const { pendingRequests } = useBorrow();
  const [myBooks, setMyBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState({ text: "", type: "" });

  // Lấy sách của riêng user
  useEffect(() => {
    const fetchMyBooks = async () => {
      try {
        const res = await bookApi.getMyBooks();
        setMyBooks(res || []);
      } catch (err) {
        console.error("Error fetching my books:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyBooks();
  }, []);

  // Check if book has pending requests
  const hasPendingRequests = (bookId) => {
    return pendingRequests.some((req) => {
      const reqBookId = typeof req.bookId === 'string' ? req.bookId : req.bookId?._id;
      return reqBookId === bookId;
    });
  };

  const handleDelete = async (bookId) => {
    if (hasPendingRequests(bookId)) {
      setMessage({ 
        text: "Cannot delete! This book has pending borrow requests", 
        type: "error" 
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return;
    }

    if (!window.confirm("Are you sure you want to delete this book?")) return;
    
    try {
      await deleteBook(bookId);
      setMyBooks((prev) => prev.filter((b) => b._id !== bookId));
      setMessage({ text: "Book deleted successfully!", type: "success" });
    } catch (err) {
      console.error("Error deleting book:", err);
      setMessage({ text: "Failed to delete book", type: "error" });
    } finally {
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book._id);
    setEditForm({
      title: book.title,
      authors: Array.isArray(book.authors) ? book.authors.join(", ") : book.authors,
      categories: Array.isArray(book.categories) ? book.categories.join(", ") : book.categories,
      description: book.description || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingBook(null);
    setEditForm({});
  };

  const handleSaveEdit = async (bookId) => {
    try {
      const updatedData = {
        title: editForm.title,
        authors: editForm.authors,
        categories: editForm.categories,
        description: editForm.description,
      };

      await updateBook(bookId, updatedData);
      
      // Update local state
      setMyBooks((prev) =>
        prev.map((b) =>
          b._id === bookId ? { ...b, ...updatedData } : b
        )
      );

      setEditingBook(null);
      setEditForm({});
      setMessage({ text: "Book updated successfully!", type: "success" });
    } catch (err) {
      console.error("Error updating book:", err);
      setMessage({ text: "Failed to update book", type: "error" });
    } finally {
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-[#BE5985] mb-2">
          📚 Your Books
        </h2>
        <p className="text-gray-600">
          Manage your book collection - Edit details or remove books
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Books List */}
      {myBooks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-xl text-gray-600 mb-2">No books yet</p>
          <p className="text-gray-500">
            Start adding books to your collection!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {myBooks.map((book) => {
            const isEditing = editingBook === book._id;
            const hasPending = hasPendingRequests(book._id);

            return (
              <div
                key={book._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row gap-4 p-6">
                  {/* Book Thumbnail */}
                  <div className="flex-shrink-0">
                    {book.thumbnail ? (
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

                  {/* Book Info */}
                  <div className="flex-1 space-y-3">
                    {isEditing ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({ ...editForm, title: e.target.value })
                          }
                          className="w-full px-3 py-2 border-2 border-[#FFB8E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7FA9]"
                          placeholder="Title"
                        />
                        <input
                          type="text"
                          value={editForm.authors}
                          onChange={(e) =>
                            setEditForm({ ...editForm, authors: e.target.value })
                          }
                          className="w-full px-3 py-2 border-2 border-[#FFB8E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7FA9]"
                          placeholder="Authors (comma separated)"
                        />
                        <input
                          type="text"
                          value={editForm.categories}
                          onChange={(e) =>
                            setEditForm({ ...editForm, categories: e.target.value })
                          }
                          className="w-full px-3 py-2 border-2 border-[#FFB8E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7FA9]"
                          placeholder="Categories (comma separated)"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                          className="w-full px-3 py-2 border-2 border-[#FFB8E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC7FA9]"
                          placeholder="Description"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(book._id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                          >
                            ✓ Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                          >
                            ✗ Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div>
                          <h3 className="text-lg font-bold text-[#BE5985] mb-1">
                            {book.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            by {normalizeAuthors(book.authors)}
                          </p>
                        </div>

                        <div className="space-y-1 text-sm">
                          <p className="text-gray-700">
                            <span className="font-semibold">Category:</span>{" "}
                            {normalizeCategories(book.categories)}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-semibold">Status:</span>{" "}
                            {book.available ? (
                              <span className="text-green-600">✓ Available</span>
                            ) : (
                              <span className="text-red-600">✗ Borrowed</span>
                            )}
                          </p>
                          {hasPending && (
                            <p className="text-yellow-600 font-semibold">
                              ⏳ Has pending requests
                            </p>
                          )}
                        </div>

                        {book.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {book.description}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleEdit(book)}
                            className="px-4 py-2 bg-[#EC7FA9] text-white rounded-lg hover:bg-[#BE5985] transition-colors font-semibold text-sm"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(book._id)}
                            disabled={hasPending || !book.available}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                              hasPending || !book.available
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-red-500 text-white hover:bg-red-600"
                            } transition-colors`}
                            title={
                              hasPending
                                ? "Cannot delete - has pending requests"
                                : !book.available
                                ? "Cannot delete - currently borrowed"
                                : ""
                            }
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </>
                    )}
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

export default YourBooks;
