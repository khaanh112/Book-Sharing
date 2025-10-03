import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loading from "../Comon/Loading";

const PublicRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loading />;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
