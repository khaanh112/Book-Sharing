import axios from "axios";

export const searchGoogleBooks = async (query) => {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${process.env.API_GOOGLEBOOK}`;
  const response = await axios.get(url);
  return response.data;
};

