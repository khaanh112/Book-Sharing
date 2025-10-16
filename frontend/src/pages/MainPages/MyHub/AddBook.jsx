  import React, { useState, useContext } from "react";
  import { UseBook } from "../../../context/BookContext";
  import BookApi from "../../../api/BookApi"; // vẫn cần để searchBooks
  import BookCard from "../../../components/BookCard";
  import Loading from "../../../components/Comon/Loading";
  import Resizer from "react-image-file-resizer";
  import { toast } from 'react-toastify';

  const AddBook = () => {
    const { createBook } = UseBook();


    // Form thủ công
    const [title, setTitle] = useState("");
    const [authors, setAuthors] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [thumbnail, setThumbnail] = useState(null);

    // Google Books
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);

const resizeFile = (file) =>
  new Promise((resolve) => {
    Resizer.imageFileResizer(
      file,
      800,
      800,
      "JPEG",
      80,
      0,
      (uri) => resolve(uri),
      "file"
    );
  });

   // --- Thêm sách thủ công ---
const handleSubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("title", title);
  formData.append("authors", authors);
  formData.append("category", category);
  formData.append("description", description);
    if (thumbnail) {
    const resized = await resizeFile(thumbnail);
    formData.append("thumbnail", resized);
  }

  try {
    const start = Date.now();
    await createBook(formData);
    console.log(Date.now() - start + "ms");
    toast.success("✅ Sách đã được thêm thành công!");
    setTitle(""); setAuthors(""); setCategory(""); setDescription(""); setThumbnail(null);
  } catch (err) {
    console.error("❌ Error adding manual book:", err);
    toast.error("❌ Lỗi khi thêm sách");
  }
};


// --- Tìm kiếm Google Books ---
const handleSearch = async () => {
  if (!searchQuery) return;
  setLoadingSearch(true);
  try {
    const results = await BookApi.searchBooks(searchQuery);
    setSearchResults(results || []);
  } catch (err) {
    toast.error("❌ Lỗi khi tìm kiếm sách");
  } finally {
    setLoadingSearch(false);
  }
};


const handleAddFromGoogle = async (book, index) => {
  try {
    const payload = {
      title: book.title || "Untitled",
      authors: book.authors || "Unknown author", // Backend đã join authors thành string rồi
      category: (Array.isArray(book.categories) && book.categories.length > 0) 
        ? book.categories[0] 
        : "",
      description: book.description || "",
      thumbnail: book.thumbnail || undefined, // undefined thay vì null để Joi skip
    };
    
    await createBook(payload);
    toast.success(`✅ Đã thêm "${book.title}" thành công!`);
    // Remove by index to handle duplicate googleBookIds
    setSearchResults(prev => prev.filter((_, i) => i !== index));
  } catch (err) {
    console.error("❌ Error adding book from Google Books:", err);
    console.error("❌ Error response:", err.response?.data);
    toast.error(err.response?.data?.message || "❌ Lỗi khi thêm sách từ Google Books");
  }
};




    return (
      <div className="flex flex-col gap-6">
        {/* --- Form thủ công --- */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border p-4 rounded">
          <h2 className="text-lg font-bold">Add Book Manually</h2>
          <input value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="Book Title" className="p-2 border rounded" required />
          <input value={authors} onChange={e => setAuthors(e.target.value)} type="text" placeholder="Author" className="p-2 border rounded" required />
          <input value={category} onChange={e => setCategory(e.target.value)} type="text" placeholder="Category" className="p-2 border rounded" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="p-2 border rounded" />
          <input type="file" accept="image/*" onChange={e => setThumbnail(e.target.files[0])} className="p-2 border rounded" />
          <button type="submit" className="bg-pink-500 text-white p-2 rounded hover:bg-pink-600">Upload Book</button>
        </form>

        {/* --- Google Books Search --- */}
        <div className="border p-4 rounded">
          <h2 className="text-lg font-bold mb-2">Add Book from Google Books</h2>
          <div className="flex gap-2 mb-4">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} type="text" placeholder="Search Google Books..." className="p-2 border rounded flex-1" />
            <button onClick={handleSearch} className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600">Search</button>
          </div>

          {loadingSearch && <Loading />}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((book, index) => (
              <BookCard
                key={`${book.googleBookId}-${index}`}
                book={book}
                onClick={() => handleAddFromGoogle(book, index)}
                actionLabel="Add Book"
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  export default AddBook;
