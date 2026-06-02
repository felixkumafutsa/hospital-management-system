import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Box, CircularProgress } from "@mui/material";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: { action: string; resource: string }[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
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

  // Check if user has all required permissions
  if (requiredPermissions.length > 0 && user?.role?.permissions) {
    const userPermissions = user.role.permissions;

    const hasAllPermissions = requiredPermissions.every((required) =>
      userPermissions.some(
        (userPerm) =>
          userPerm.action === required.action &&
          userPerm.resource === required.resource,
      ),
    );

    if (!hasAllPermissions) {
      // Redirect to dashboard if user doesn't have required permissions
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute;
