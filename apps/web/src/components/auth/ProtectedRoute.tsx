import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import MainLayout from "../layout/MainLayout";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: { action: string; resource: string }[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requiredPermissions = [],
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role if roles are specified
  const userRole =
    typeof user?.role === "object" ? user?.role?.name : user?.role;
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole || "")) {
    // Redirect to dashboard if user doesn't have the required role
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user has all required permissions
  if (requiredPermissions.length > 0 && user?.role?.permissions) {
    const userPermissions = user.role.permissions;

    const hasAllPermissions = requiredPermissions.every((required) =>
      userPermissions.some(
        (userPerm: any) =>
          userPerm.action === required.action &&
          userPerm.resource === required.resource,
      ),
    );

    if (!hasAllPermissions) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If all checks pass, render the children wrapped in MainLayout
  return <MainLayout>{children}</MainLayout>;
};

export default ProtectedRoute;
