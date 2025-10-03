/**
 * Utility functions for handling book data
 */

/**
 * Normalizes authors/categories field to a displayable string
 * Handles both array and string formats from database
 * @param {Array|string} field - The field to normalize
 * @param {string} fallback - Fallback value if field is empty
 * @returns {string} Comma-separated string
 */
export const normalizeArrayField = (field, fallback = "N/A") => {
  if (!field) return fallback;
  return Array.isArray(field) ? field.join(", ") : field;
};

/**
 * Normalizes authors field specifically
 * @param {Array|string} authors - The authors field
 * @returns {string} Comma-separated string
 */
export const normalizeAuthors = (authors) => {
  return normalizeArrayField(authors, "Unknown Author");
};

/**
 * Normalizes categories field specifically
 * @param {Array|string} categories - The categories field
 * @returns {string} Comma-separated string
 */
export const normalizeCategories = (categories) => {
  return normalizeArrayField(categories, "N/A");
};

/**
 * Normalizes user name from user object or string ID
 * Handles both populated user object and string ID
 * @param {Object|string} user - The user field (can be populated object or string ID)
 * @returns {string} User's display name
 */
export const normalizeUserName = (user) => {
  if (!user) return "Unknown";
  
  // If user is a string (just ID), return Unknown
  if (typeof user === "string") return "Unknown";
  
  // If user is an object, try to get name or email
  return user.name || user.email || "Unknown";
};
