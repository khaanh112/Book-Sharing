import React, { createContext, useState, useEffect, useMemo, useContext } from "react";
import bookApi from "../api/BookApi";
import { useAuth } from "./AuthContext";

const BookContext = createContext();

export const BookProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBooks();
    } else {
      setBooks([]);
    }
  }, [user]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await bookApi.getAllBooks();
      setBooks(res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };


  const createBook = async (formData) => {
    try {
      setLoading(true);
      const newBook = await bookApi.createBook(formData);
      setBooks((prev) => [...prev, newBook]);
      return newBook;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBook = async (bookId, formData) => {
    try {
      setLoading(true);
      const updatedBook = await bookApi.updateBook(bookId, formData);
      setBooks((prev) =>
        prev.map((b) => (b._id === bookId ? updatedBook : b))
      );
      return updatedBook;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const deleteBook = async (bookId) => {
    try {
      await bookApi.deleteBook(bookId);
      setBooks((prev) => prev.filter((b) => b._id !== bookId));
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const value = useMemo(
    () => ({
      books,
      loading,
      error,
      fetchBooks,
      createBook,
      updateBook,
      deleteBook,
    }),
    [books, loading, error]
  );

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  );
};



export const UseBook = () => useContext(BookContext);

