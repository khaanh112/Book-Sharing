import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const { logout } = useAuth(); // dùng hàm logout từ context
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await logout(); // gọi context logout (nó tự gọi API và setUser(null))
        navigate("/login"); // chuyển hướng
      } catch (error) {
        console.error("Logout failed:", error);
      }
    };
    doLogout();
  }, [logout, navigate]);

  return <div>Logging out...</div>;
};

export default Logout;
