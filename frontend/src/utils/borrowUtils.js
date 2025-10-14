/**
 * Borrow Utils - Helper functions for borrow-related operations
 * Reduces code duplication across components
 */

/**
 * Extract ID from object or string
 * Handles both populated (object) and non-populated (string) references
 */
export const getBookId = (bookIdOrObject) => {
  if (!bookIdOrObject) return null;
  return typeof bookIdOrObject === 'string' 
    ? bookIdOrObject 
    : bookIdOrObject?._id;
};

export const getUserId = (userIdOrObject) => {
  if (!userIdOrObject) return null;
  return typeof userIdOrObject === 'string' 
    ? userIdOrObject 
    : userIdOrObject?._id;
};

/**
 * Check if user has a pending request for a specific book
 */
export const hasRequestForBook = (requests, bookId) => {
  if (!Array.isArray(requests) || !bookId) return false;
  
  return requests.some(req => 
    getBookId(req.bookId) === bookId && req.status === "pending"
  );
};

/**
 * Check if book is currently borrowed (approved request exists)
 */
export const isBookBorrowed = (requests, bookId) => {
  if (!Array.isArray(requests) || !bookId) return false;
  
  return requests.some(req => 
    getBookId(req.bookId) === bookId && req.status === "accepted"
  );
};

/**
 * Calculate days left until due date
 * Returns negative number if overdue
 */
export const getDaysLeft = (dueDate) => {
  if (!dueDate) return 0;
  
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if borrow is overdue
 */
export const isOverdue = (dueDate) => {
  return getDaysLeft(dueDate) < 0;
};

/**
 * Get status badge configuration
 */
export const getStatusBadge = (status) => {
  const badges = {
    pending: { 
      color: "bg-yellow-100 text-yellow-700", 
      text: "⏳ Pending",
      icon: "⏳" 
    },
    accepted: { 
      color: "bg-green-100 text-green-700", 
      text: "✓ Accepted",
      icon: "✓" 
    },
    rejected: { 
      color: "bg-red-100 text-red-700", 
      text: "✗ Rejected",
      icon: "✗" 
    },
    returned: { 
      color: "bg-blue-100 text-blue-700", 
      text: "↩️ Returned",
      icon: "↩️" 
    },
  };
  
  return badges[status] || badges.pending;
};

/**
 * Format due date with status (overdue/due soon)
 */
export const formatDueDate = (dueDate) => {
  if (!dueDate) return "";
  
  const daysLeft = getDaysLeft(dueDate);
  const date = new Date(dueDate).toLocaleDateString();
  
  if (daysLeft < 0) {
    return `Overdue by ${Math.abs(daysLeft)} day(s) (${date})`;
  } else if (daysLeft === 0) {
    return `Due today (${date})`;
  } else if (daysLeft === 1) {
    return `Due tomorrow (${date})`;
  } else if (daysLeft <= 3) {
    return `Due in ${daysLeft} days (${date}) ⚠️`;
  } else {
    return `Due in ${daysLeft} days (${date})`;
  }
};

/**
 * Get urgency level for due date styling
 */
export const getDueDateUrgency = (dueDate) => {
  const daysLeft = getDaysLeft(dueDate);
  
  if (daysLeft < 0) return "overdue"; // Red
  if (daysLeft <= 3) return "urgent";  // Yellow
  return "normal"; // Green
};

/**
 * Validate borrow request days
 */
export const validateBorrowDays = (days) => {
  const numDays = parseInt(days, 10);
  
  if (isNaN(numDays)) {
    return { valid: false, error: "Please enter a valid number" };
  }
  
  if (numDays < 1) {
    return { valid: false, error: "Minimum borrow period is 1 day" };
  }
  
  if (numDays > 30) {
    return { valid: false, error: "Maximum borrow period is 30 days" };
  }
  
  return { valid: true, days: numDays };
};

/**
 * Filter books that user can borrow (available, not owned by user)
 */
export const getAvailableBooksForUser = (books, userId) => {
  if (!Array.isArray(books) || !userId) return [];
  
  return books.filter(book => {
    // Only show available books
    if (!book.available) return false;
    
    // Don't show user's own books
    const bookOwnerId = getUserId(book.ownerId);
    if (bookOwnerId === userId) return false;
    
    return true;
  });
};
