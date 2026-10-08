import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import { CircularProgress, Box } from "@mui/material";
import ConsultationDrawer from "./components/ConsultationDrawer";
import VisitDrawer from "./components/VisitDrawer";

// Critical core pages - eagerly loaded (not lazy) for instant navigation
import DashboardPage from "./pages/dashboard/DashboardPage";
import AppointmentsPage from "./pages/appointments/AppointmentsPage";
import PatientListPage from "./pages/patients/PatientListPage";

// Grouped lazy loading - related pages share chunks to reduce network requests
// Role-specific dashboards
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
const PharmacyShopPage = lazy(() => import("./pages/pharmacy/PharmacyShopPage"));
const LabDashboardPage = lazy(() => import("./pages/lab/LabDashboardPage"));
const AccountsDashboardPage = lazy(
  () => import("./pages/accounts/AccountsDashboardPage"),
);

// Patient management pages
const PatientRegistrationPage = lazy(
  () => import("./pages/patients/PatientRegistrationPage"),
);
const PatientDetailPage = lazy(
  () => import("./pages/patients/PatientDetailPage"),
);

// Admin and specialty pages
const ConsultationsPage = lazy(
  () => import("./pages/consultations/ConsultationsPage"),
);
const FinanceDashboardPage = lazy(
  () => import("./pages/finance/FinanceDashboardPage"),
);
const InvoicesPage = lazy(
  () => import("./pages/finance/InvoicesPage"),
);
const UserManagementPage = lazy(
  () => import("./pages/users/UserManagementPage"),
);
const PrescriptionsPage = lazy(
  () => import("./pages/prescriptions/PrescriptionsPage"),
);
const LabTestsPage = lazy(() => import("./pages/lab/LabTestsPage"));
const PharmacyInventoryPage = lazy(
  () => import("./pages/pharmacy/PharmacyInventoryPage"),
);
const MaternityDashboardPage = lazy(
  () => import("./pages/maternity/MaternityDashboardPage"),
);
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const DutyRosterPage = lazy(() => import("./pages/duty-roster/DutyRosterPage"));
const TheaterPage = lazy(() => import("./pages/theater/TheaterPage"));

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

          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Admin Dashboard - strictly for ADMINISTRATOR and MD */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR", "ADMIN", "MD"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Legacy / Alias dashboard routes */}
          <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/doctor/dashboard" element={<Navigate to="/doctor" replace />} />
          <Route path="/nurse/dashboard" element={<Navigate to="/nurse" replace />} />
          <Route path="/reception/dashboard" element={<Navigate to="/reception" replace />} />
          <Route path="/pharmacy/dashboard" element={<Navigate to="/pharmacy" replace />} />
          <Route path="/lab/dashboard" element={<Navigate to="/lab" replace />} />
          <Route path="/finance/dashboard" element={<Navigate to="/finance" replace />} />

          {/* Reception routes */}
          <Route
            path="/reception"
            element={
              <ProtectedRoute allowedRoles={["RECEPTIONIST", "RECEPTION_CASHIER", "ADMINISTRATOR"]}>
                <ReceptionDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Doctor routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR", "ADMINISTRATOR"]}>
                <DoctorDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Nurse routes */}
          <Route
            path="/nurse"
            element={
              <ProtectedRoute allowedRoles={["NURSE", "ADMINISTRATOR"]}>
                <NurseDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Pharmacy routes */}
          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute allowedRoles={["PHARMACIST", "ADMINISTRATOR"]}>
                <PharmacyDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/shop"
            element={
              <ProtectedRoute allowedRoles={["PHARMACIST", "RECEPTIONIST", "RECEPTION_CASHIER", "ADMINISTRATOR"]}>
                <PharmacyShopPage />
              </ProtectedRoute>
            }
          />

          {/* Laboratory routes */}
          <Route
            path="/lab"
            element={
              <ProtectedRoute allowedRoles={["LAB_TECH", "ADMINISTRATOR"]}>
                <LabDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Accounts/Finance routes */}
          <Route
            path="/accounts"
            element={
              <ProtectedRoute allowedRoles={["RECEPTION_CASHIER", "RECEPTIONIST", "CASHIER", "ADMINISTRATOR"]}>
                <AccountsDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Appointments route */}
          <Route
            path="/appointments"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMINISTRATOR",
                  "RECEPTIONIST",
                  "RECEPTION_CASHIER",
                  "DOCTOR",
                  "NURSE",
                ]}
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
              <ProtectedRoute
                allowedRoles={["RECEPTIONIST", "RECEPTION_CASHIER", "ADMINISTRATOR", "DOCTOR"]}
              >
                <PatientRegistrationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMINISTRATOR",
                  "RECEPTIONIST",
                  "RECEPTION_CASHIER",
                  "DOCTOR",
                  "NURSE",
                ]}
              >
                <PatientDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Admin-only new pages */}
          <Route
            path="/consultations"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR", "DOCTOR"]}>
                <ConsultationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR", "RECEPTION_CASHIER", "RECEPTIONIST", "CASHIER"]}>
                <FinanceDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/invoices"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR", "RECEPTION_CASHIER", "RECEPTIONIST", "CASHIER"]}>
                <InvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff-management"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-management"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/duty-roster"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR"]}>
                <DutyRosterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescriptions"
            element={
              <ProtectedRoute
                allowedRoles={["ADMINISTRATOR", "PHARMACIST", "DOCTOR"]}
              >
                <PrescriptionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lab-tests"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR", "LAB_TECH"]}>
                <LabTestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/inventory"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR", "PHARMACIST"]}>
                <PharmacyInventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maternity"
            element={
              <ProtectedRoute
                allowedRoles={["ADMINISTRATOR", "NURSE", "DOCTOR"]}
              >
                <MaternityDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/theater"
            element={
              <ProtectedRoute allowedRoles={["ADMINISTRATOR", "DOCTOR", "NURSE", "ANESTHETIST"]}>
                <TheaterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect for unmatched routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        {/* Global drawers that can be opened from anywhere */}
        <ConsultationDrawer />
        <VisitDrawer />
      </Suspense>
    </AuthProvider>
  );
}

export default App;