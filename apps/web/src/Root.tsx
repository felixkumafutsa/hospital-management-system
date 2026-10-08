import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/auth/LoginPage";
import ReceptionDashboard from "./pages/reception/ReceptionDashboardPage";
import DoctorDashboard from "./pages/doctor/DoctorDashboardPage";
import NurseDashboard from "./pages/nurse/NurseDashboardPage";
import AdminDashboard from "./pages/dashboard/DashboardPage";
import LabDashboard from "./pages/lab/LabDashboardPage";
import PharmacyDashboard from "./pages/pharmacy/PharmacyDashboardPage";
import FinanceDashboard from "./pages/finance/FinanceDashboardPage";
import SuperAdminDashboard from "./pages/dashboard/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

const AppRoutes: React.FC = () => {
  const { loading } = useAuth();

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

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/reception" element={<ReceptionDashboard />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/nurse" element={<NurseDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/lab" element={<LabDashboard />} />
        <Route path="/pharmacy" element={<PharmacyDashboard />} />
        <Route path="/finance" element={<FinanceDashboard />} />
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const Root: React.FC = () => (
  <Router>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </Router>
);

export default Root;