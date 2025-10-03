import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import { useAuth } from "../../context/AuthContext";

const MainLayout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#FFEDFA]">
      {isAuthenticated && <Header />}

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {isAuthenticated && <Footer />}
    </div>
  );
};

export default MainLayout;
