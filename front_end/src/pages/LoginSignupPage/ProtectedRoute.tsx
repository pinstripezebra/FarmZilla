import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../../context/UserContex";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />; // Redirect to /Login if not authenticated
  }

  return <>{children}</>;
};

export default ProtectedRoute;