import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import { CircularProgress, Box } from "@mui/material";

// Lazy load all page components for code splitting
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const ReceptionDashboardPage = lazy(
  () => import("./pages/reception/ReceptionDashboardPage"),
);
const DoctorDashboardPage = lazy(
  () => import("./pages/doctor/DoctorDashboardPage"),
);
const NurseDashboardPage = lazy(
  () => import("./pages/nurse/NurseDashboardPage"),
);
const PharmacyDashboardPage = lazy(
  () => import("./pages/pharmacy/PharmacyDashboardPage"),
);
const LabDashboardPage = lazy(() => import("./pages/lab/LabDashboardPage"));
const AccountsDashboardPage = lazy(
  () => import("./pages/accounts/AccountsDashboardPage"),
);
const AppointmentsPage = lazy(
  () => import("./pages/appointments/AppointmentsPage"),
);
const PatientRegistrationPage = lazy(
  () => import("./pages/patients/PatientRegistrationPage"),
);
const PatientListPage = lazy(() => import("./pages/patients/PatientListPage"));
const PatientDetailPage = lazy(
  () => import("./pages/patients/PatientDetailPage"),
);
// New admin pages we just created
const ConsultationsPage = lazy(
  () => import("./pages/consultations/ConsultationsPage"),
);
const FinanceDashboardPage = lazy(
  () => import("./pages/finance/FinanceDashboardPage"),
);
const StaffManagementPage = lazy(
  () => import("./pages/staff/StaffManagementPage"),
);
const PrescriptionsPage = lazy(
  () => import("./pages/prescriptions/PrescriptionsPage"),
);
const LabTestsPage = lazy(() => import("./pages/lab/LabTestsPage"));
const UsersManagementPage = lazy(
  () => import("./pages/users/UsersManagementPage"),
);
const PharmacyInventoryPage = lazy(
  () => import("./pages/pharmacy/PharmacyInventoryPage"),
);
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));

// Loading fallback component
const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Reception routes */}
          <Route
            path="/reception"
            element={
              <ProtectedRoute allowedRoles={["reception", "admin"]}>
                <ReceptionDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Doctor routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={["doctor", "admin"]}>
                <DoctorDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Nurse routes */}
          <Route
            path="/nurse"
            element={
              <ProtectedRoute allowedRoles={["nurse", "admin"]}>
                <NurseDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Pharmacy routes */}
          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute allowedRoles={["pharmacist", "admin"]}>
                <PharmacyDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Laboratory routes */}
          <Route
            path="/lab"
            element={
              <ProtectedRoute allowedRoles={["lab_technician", "admin"]}>
                <LabDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Accounts/Finance routes */}
          <Route
            path="/accounts"
            element={
              <ProtectedRoute allowedRoles={["accountant", "admin"]}>
                <AccountsDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Appointments route */}
          <Route
            path="/appointments"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "reception", "doctor", "nurse"]}
              >
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />

          {/* Patient routes */}
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <PatientListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/register"
            element={
              <ProtectedRoute allowedRoles={["reception", "admin", "doctor"]}>
                <PatientRegistrationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "reception", "doctor", "nurse"]}
              >
                <PatientDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Admin-only new pages */}
          <Route
            path="/consultations"
            element={
              <ProtectedRoute allowedRoles={["admin", "doctor"]}>
                <ConsultationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                <FinanceDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff-management"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <StaffManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescriptions"
            element={
              <ProtectedRoute allowedRoles={["admin", "pharmacist", "doctor"]}>
                <PrescriptionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lab-tests"
            element={
              <ProtectedRoute allowedRoles={["admin", "lab_technician"]}>
                <LabTestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UsersManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/inventory"
            element={
              <ProtectedRoute allowedRoles={["admin", "pharmacist"]}>
                <PharmacyInventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
