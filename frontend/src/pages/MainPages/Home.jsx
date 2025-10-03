import React, { useState, useMemo } from "react";
import { UseBook } from "../../context/BookContext";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Comon/Loading";
import { normalizeAuthors, normalizeUserName } from "../../utils/bookUtils";
import { useAuth } from "../../context/AuthContext";

export default function Home() {
  const { books, loading } = UseBook();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleViewDetails = (book) => {
    navigate(`/bookdetail/${book._id}`);
  };

  // Filter books: only available books that are not owned by current user
  const availableBooks = useMemo(() => {
    if (!books || !user) return [];
    
    return books.filter((book) => {
      // Only show available books
      if (!book.available) return false;
      
      // Don't show user's own books
      const bookOwnerId = typeof book.ownerId === 'object' ? book.ownerId._id : book.ownerId;
      if (bookOwnerId === user._id) return false;
      
      return true;
    });
  }, [books, user]);

  // Filter books based on search query from available books
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return availableBooks;
    const query = searchQuery.toLowerCase();
    return availableBooks.filter(
      (book) =>
        book.title?.toLowerCase().includes(query) ||
        book.authors?.some((author) => author.toLowerCase().includes(query)) ||
        book.categories?.some((cat) => cat.toLowerCase().includes(query))
    );
  }, [availableBooks, searchQuery]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-[#BE5985] mb-2">
          📚 Available Books
        </h1>
        <p className="text-lg text-[#EC7FA9]">
          Discover and borrow books from other users
        </p>
      </header>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search books by title, author, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-[#EC7FA9] border-2 border-[#FFB8E0] transition-all"
          />
        </div>
        {searchQuery && (
          <p className="text-center mt-3 text-[#BE5985]">
            Found {filteredBooks.length} book(s)
          </p>
        )}
      </div>

      {/* Book Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            return (
              <div
                key={book._id}
                onClick={() => handleViewDetails(book)}
                className="bg-white rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden cursor-pointer border-2 border-[#FFEDFA] hover:border-[#EC7FA9]"
              >
                {/* Book Cover */}
                <div className="h-64 bg-gradient-to-br from-[#FFEDFA] to-[#FFB8E0] flex items-center justify-center overflow-hidden relative">
                  {book.thumbnail ? (
                    <img
                      src={book.thumbnail}
                      alt={book.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full text-[#BE5985] font-bold text-3xl">
                      📖
                    </div>
                  )}
                </div>

                {/* Book Info */}
                <div className="p-5 space-y-3">
                  {/* Title */}
                  <h2 className="text-lg font-bold text-[#BE5985] line-clamp-2 min-h-[3.5rem]">
                    {book.title}
                  </h2>
                  
                  {/* Author */}
                  <p className="text-xs text-gray-500 line-clamp-1">
                    ✍️ {normalizeAuthors(book.authors)}
                  </p>
                  
                  {/* Owner - Nổi bật */}
                  <div className="flex items-center gap-2 bg-gradient-to-r from-[#FFEDFA] to-[#FFB8E0] rounded-lg p-2">
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-xs text-[#BE5985] font-semibold">Owner</p>
                      <p className="text-sm font-bold text-[#BE5985]">{normalizeUserName(book.ownerId)}</p>
                    </div>
                  </div>
                  
                  {/* View Button */}
                  <button
                    className="w-full py-2.5 rounded-lg font-semibold bg-gradient-to-r from-[#EC7FA9] to-[#BE5985] text-white transition-all duration-200 hover:from-[#BE5985] hover:to-[#9B4A6B] hover:shadow-lg active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(book);
                    }}
                  >
                    📚 View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-2xl text-[#BE5985] mb-2">🔍 No books found</p>
          <p className="text-[#EC7FA9]">
            {searchQuery
              ? "Try adjusting your search query"
              : "No available books to borrow at the moment"}
          </p>
        </div>
      )}
    </div>
  );
}
