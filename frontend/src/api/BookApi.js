import API from "./axios";

const BookApi = {
  searchBooks: async (query) => {
    // Add timestamp to bypass browser cache
    const response = await API.get(`/books/google-search?q=${query}&_t=${Date.now()}`);
    return response.data;
  },
  getAllBooks: async () => {
    const response = await API.get("/books");
    return response.data;
  },
  getBookById: async (id) => {
    const response = await API.get(`/books/${id}`);
    return response.data;
  },
  getMyBooks: async () => {
    const response = await API.get("/books/my-books");
    return response.data;
  },
  createBook: async (formData) => {
  const res = await API.post("/books", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
  },
  updateBook: async (id, bookData) => {
    const response = await API.put(`/books/${id}`, bookData);
    return response.data;
  },
  deleteBook: async (id) => {
    const response = await API.delete(`/books/${id}`);
    return response.data;
  },
};

export default BookApi;
