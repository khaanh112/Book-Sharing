import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useContext,
} from "react";
import BorrowApi from "../api/BorrowApi";
import { useAuth } from "./AuthContext";
import { UseBook } from "./BookContext";

const BorrowContext = createContext();

// Custom hook for using BorrowContext
export const useBorrow = () => {
  const context = useContext(BorrowContext);
  if (!context) {
    throw new Error("useBorrow must be used within a BorrowProvider");
  }
  return context;
};

export const BorrowProvider = ({ children }) => {
  const [myBorrows, setMyBorrows] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user, isAuthenticated } = useAuth();
  const { updateBook, books } = UseBook();

  // 🔹 Fetch dữ liệu từ DB khi login
  useEffect(() => {
    if (isAuthenticated && user && Object.keys(user).length > 0) {
      fetchAllBorrowData();
    } else {
      // Reset state when logged out
      setMyBorrows([]);
      setMyRequests([]);
      setPendingRequests([]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchAllBorrowData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [borrows, requests, pending] = await Promise.all([
        BorrowApi.getMyBorrows(),
        BorrowApi.getMyBorrowsRequests(),
        BorrowApi.getPendingRequests()
      ]);
      
    
      // Backend trả về { status: "success", borrows: [...] }
      const myBorrowsData = Array.isArray(borrows?.data?.borrows) ? borrows.data.borrows : [];
      const myRequestsData = Array.isArray(requests?.data?.borrows) ? requests.data.borrows : [];
      const pendingRequestsData = Array.isArray(pending?.data?.borrows) ? pending.data.borrows : [];
      
      setMyBorrows(myBorrowsData);
      setMyRequests(myRequestsData);
      setPendingRequests(pendingRequestsData);
    } catch (err) {
  
      setError(err?.response?.data?.message || "Failed to fetch borrow data");
      setMyBorrows([]);
      setMyRequests([]);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Tạo borrow request
  const createBorrow = async (data) => {
    try {
      setError(null);
      
      console.log("🔄 Creating borrow request with data:", data);
      
      // Kiểm tra xem đã có request pending cho sách này chưa
      const existingRequest = myRequests.find(
        (req) => {
          // bookId có thể là string hoặc object (populated)
          const requestBookId = typeof req.bookId === 'string' 
            ? req.bookId 
            : req.bookId?._id;
          return requestBookId === data.bookId && req.status === "pending";
        }
      );
      
      if (existingRequest) {
        const errorMsg = "You already have a pending request for this book";
        setError(errorMsg);
        throw { success: false, message: errorMsg };
      }
      
      const res = await BorrowApi.createBorrow(data);
      console.log("✅ Create borrow response:", res);
      
      // Backend trả về { status: "success", borrow: {...} }
      const newRequest = res?.data?.borrow;
      
      if (newRequest) {
        // Enrich bookId with full book data from BookContext
        const enrichedRequest = {
          ...newRequest,
          bookId: typeof newRequest.bookId === 'string'
            ? books.find(b => b._id === newRequest.bookId) || newRequest.bookId
            : newRequest.bookId
        };
        
        console.log("📝 Created Request:", {
          original: newRequest.bookId,
          enriched: enrichedRequest.bookId
        });
        
        setMyRequests((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          // Đảm bảo không có duplicate
          const isDuplicate = prevArray.some(req => req._id === enrichedRequest._id);
          return isDuplicate ? prevArray : [...prevArray, enrichedRequest];
        });
      }
      
      return { 
        success: true, 
        data: newRequest, 
        message: "Borrow request created successfully!" 
      };
    } catch (err) {
      console.error("❌ Create borrow error details:", {
        error: err,
        response: err?.response,
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
        config: err?.config
      });
      
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to create borrow request";
      setError(errorMsg);
      throw { success: false, message: errorMsg };
    }
  };

  // 🔹 Accept borrow request
  const acceptBorrow = async (id) => {
    try {
      const res = await BorrowApi.acceptBorrow(id);
      // Backend trả về { status: "success", borrow: {...} }
      const acceptedBorrow = res.data.borrow;
      
      // Remove from pendingRequests (chủ sách không còn thấy pending)
      setPendingRequests((prev) => prev.filter((r) => r._id !== id));
      
      // Add to myBorrows (chủ sách thấy đang cho mượn)
      setMyBorrows((prev) => {
        const exists = prev.some(b => b._id === id);
        return exists ? prev.map(b => b._id === id ? acceptedBorrow : b) : [...prev, acceptedBorrow];
      });
      
      // Update myRequests status (người mượn thấy status thay đổi từ pending -> accepted)
      setMyRequests((prev) =>
        prev.map((req) => (req._id === id ? acceptedBorrow : req))
      );

      if (acceptedBorrow.bookId) {
        const bookIdStr = typeof acceptedBorrow.bookId === 'string' 
          ? acceptedBorrow.bookId 
          : acceptedBorrow.bookId._id;
        updateBook(bookIdStr, { available: false });
      }
      
      return acceptedBorrow;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // 🔹 Reject borrow request
  const rejectBorrow = async (id) => {
    try {
      const res = await BorrowApi.rejectBorrow(id);
      // Backend trả về { status: "success", borrow: {...} }
      const rejectedBorrow = res.data.borrow;
      
      // Remove from pendingRequests (chủ sách không còn thấy pending)
      setPendingRequests((prev) => prev.filter((r) => r._id !== id));
      
      // Update myRequests status (người mượn thấy status = rejected)
      setMyRequests((prev) =>
        prev.map((req) => (req._id === id ? rejectedBorrow : req))
      );
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // 🔹 Return borrow
  const returnBorrow = async (id) => {
    try {
      const res = await BorrowApi.returnBorrow(id);
      // Backend trả về { status: "success", borrow: {...} }
      const returnedBorrow = res.data.borrow;
      setMyBorrows((prev) =>
        prev.map((b) => (b._id === id ? returnedBorrow : b))
      );

      if (returnedBorrow.bookId) {
        updateBook(returnedBorrow.bookId, { available: true });
      }
      return returnedBorrow;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // 🔹 Delete/Cancel borrow request (chỉ pending requests)
  const deleteBorrowRequest = async (id) => {
    try {
      await BorrowApi.deleteBorrow(id);
      // Remove from myRequests state
      setMyRequests((prev) => prev.filter((r) => r._id !== id));
      return { success: true, message: "Request cancelled successfully" };
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Failed to cancel request";
      setError(errorMsg);
      throw { success: false, message: errorMsg };
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // 🔹 Context value
  const value = useMemo(
    () => ({
      myBorrows,
      myRequests,
      pendingRequests,
      loading,
      error,
      fetchAllBorrowData,
      createBorrow,
      acceptBorrow,
      rejectBorrow,
      returnBorrow,
      deleteBorrowRequest,
      clearError,
    }),
    [myBorrows, myRequests, pendingRequests, loading, error]
  );

  return (
    <BorrowContext.Provider value={value}>
      {children}
    </BorrowContext.Provider>
  );
};

// Legacy export for backward compatibility
export const UseBorrow = useBorrow;

export default BorrowProvider;
