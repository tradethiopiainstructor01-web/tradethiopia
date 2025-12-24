import React from "react";
import { Navigate } from "react-router-dom";
import { useUserStore } from "../store/user.js";

const ProtectedRoute = ({ children }) => {
  const currentUser = useUserStore((s) => s.currentUser);
  if (!currentUser || !currentUser.token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
