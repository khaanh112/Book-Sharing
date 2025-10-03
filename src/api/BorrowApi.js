import API from "./axios";

const BorrowApi = {
  // Thử với các endpoint variations - uncomment để test
  createBorrow: (data) => API.post("/borrows", data), 
  acceptBorrow: (id) => API.put(`/borrows/${id}/accept`),
  rejectBorrow: (id) => API.put(`/borrows/${id}/reject`),
  returnBorrow: (id) => API.put(`/borrows/${id}/return`),
  getMyBorrows: () => API.get("/borrows/my-borrows"),
  getMyBorrowsRequests: () => API.get("/borrows/my-requests"),
  getPendingRequests: () => API.get("/borrows/pending-requests"),
  getBorrows: () => API.get("/borrow-requests"),
  getBorrowById: (id) => API.get(`/borrow-requests/${id}`),
  getBorrowsByUser: (userId) => API.get(`/borrow-requests/user/${userId}`),
  deleteBorrow: (id) => API.delete(`/borrow-requests/${id}`),
};

export default BorrowApi;