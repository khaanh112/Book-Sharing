import React from 'react';
import PropTypes from 'prop-types';

/**
 * BookThumbnail Component
 * Displays book cover image with fallback for missing thumbnails
 */
const BookThumbnail = ({ thumbnail, title, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-20 h-28',
    md: 'w-32 h-44',
    lg: 'w-48 h-64'
  };

  const sizeClass = sizes[size] || sizes.md;

  return thumbnail ? (
    <img
      src={thumbnail}
      alt={title}
      className={`${sizeClass} object-cover rounded-lg shadow ${className}`}
      onError={(e) => {
        // Fallback to placeholder if image fails to load
        e.target.style.display = 'none';
        e.target.nextElementSibling.style.display = 'flex';
      }}
    />
  ) : (
    <div className={`${sizeClass} bg-gradient-to-br from-[#FFEDFA] to-[#FFB8E0] flex items-center justify-center rounded-lg shadow ${className}`}>
      <span className="text-4xl">📚</span>
    </div>
  );
};

BookThumbnail.propTypes = {
  thumbnail: PropTypes.string,
  title: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string
};

export default BookThumbnail;
