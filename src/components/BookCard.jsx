import React from "react";

const BookCard = ({ book, onClick, actionLabel = "View Details" }) => {
  const thumbnailSrc = book.thumbnail || null;
  const authors = Array.isArray(book.authors) ? book.authors.join(", ") : book.authors || "Unknown Author";

  return (
    <div
      className="bg-gradient-to-b from-[#FFB8E0] to-[#EC7FA9] rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
    >
      {/* Book Cover */}
      <div className="h-56 bg-[#FFEDFA] flex items-center justify-center overflow-hidden">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full text-[#BE5985] font-bold text-xl">
            📖 No Cover
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-4">
        <h2 className="text-xl font-bold text-[#BE5985] mb-2 line-clamp-2 min-h-[3.5rem]">
          {book.title}
        </h2>
        <p className="text-sm text-white mb-4 line-clamp-1">
          {authors}
        </p>
        <button
          className="w-full py-2.5 rounded-lg font-semibold bg-[#BE5985] text-[#FFEDFA] transition-all duration-200 hover:bg-[#9B4A6B] hover:shadow-md active:scale-95"
          onClick={onClick}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default BookCard;
