import { Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import MainLayout from "./components/Routes/MainLayout";
import ProtectedRoute from "./components/Routes/ProtectedRoutes";
import PublicRoute from "./components/Routes/PublicRoutes";

import Signup from"./pages/AuthPages/Signup";
import VerifyEmail from "./pages/AuthPages/verifyEmail";
import Login from "./pages/AuthPages/Login";
import Logout from "./pages/AuthPages/Logout";

import Home from "./pages/MainPages/Home";
import MyHubLayout from "./pages/MainPages/MyHub/MyHubLayout";
import YourBooks from "./pages/MainPages/MyHub/YourBooks";
import BorrowRequests from "./pages/MainPages/MyHub/BorrowRequests";
import BorrowedBooks from "./pages/MainPages/MyHub/BorrowedBooks";
import PendingRequests from "./pages/MainPages/MyHub/PendingRequests";
import AddBook from "./pages/MainPages/MyHub/AddBook";
import Profile from "./pages/MainPages/Profile";
import BookDetail from "./pages/MainPages/BookDetail";
import NotificationPage from "./pages/NotificationPage";
import RateLimitNotification from "./components/RateLimitNotification"; // Optional counter

const App = () => {
  return (
    <>
      {/* React Toastify Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      {/* Optional: Rate Limit Counter (có thể bỏ nếu không cần) */}
      <RateLimitNotification />
      
      <Routes>
        {/* Auth routes -> không layout */}
        <Route element={<PublicRoute />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/login" element={<Login />} />
        </Route>

      {/* Các route trong layout */}
      <Route element={<MainLayout />}>

        <Route path="*" element={<h1 className="text-red-500 text-2xl">404 - Page Not Found</h1>} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          
          {/* MyHub nested routes */}
          <Route path="/my-hub" element={<MyHubLayout />}>
            <Route index element={<YourBooks />} />
            <Route path="your-books" element={<YourBooks />} />
            <Route path="borrow-requests" element={<BorrowRequests />} />
            <Route path="borrowed-books" element={<BorrowedBooks />} />
            <Route path="pending-requests" element={<PendingRequests />} />
            <Route path="add-book" element={<AddBook />} />
          </Route>
          
          <Route path="/logout" element={<Logout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bookdetail/:id" element={<BookDetail />} />
          <Route path="/notifications" element={<NotificationPage />} />
          
        </Route>
        
      </Route>
    </Routes>
    </>
  );
};

export default App;
