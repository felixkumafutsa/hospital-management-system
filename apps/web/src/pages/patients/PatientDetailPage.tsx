import React from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Card,
} from "@mui/material";
import { Print, ArrowBack, Add } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

interface Patient {
  id: string;
  patientNumber: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelation: string;
  bloodGroup: string;
  allergies: string[];
  insuranceProvider: string;
  insuranceNumber: string;
  isActive: boolean;
  createdAt: string;
}

interface Visit {
  id: string;
  visitDate: string;
  visitType: string;
  status: string;
  consultation?: string;
  consultationFee?: number;
  admissionDate?: string;
  dischargeDate?: string;
  stayDuration?: number;
  roomNumber?: string;
  dailyRate?: number;
}

interface LabTest {
  id: string;
  testName: string;
  price: number;
  status: string;
}

interface PrescriptionItem {
  id: string;
  medicineName: string;
  quantity: number;
  price: number;
  dispensed: boolean;
}

interface Invoice {
  id: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
}

const PatientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);

  // Fetch core patient and visits data in parallel
  const { data: combinedData, isLoading: coreDataLoading } = useQuery({
    queryKey: ["patient-detail", id],
    queryFn: async () => {
      // Fetch base data in parallel
      const [patientResponse, visitsResponse] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/visits/patient/${id}`),
      ]);

      const patient = patientResponse.data.patient as Patient;
      const visits = visitsResponse.data.visits as Visit[];

      // Find current active visit
      const currentVisit = visits.find(
        (v) => v.status !== "COMPLETED" && v.status !== "CANCELLED",
      );

      // If there's a current visit, fetch its related data in parallel too
      if (currentVisit?.id) {
        const [labTestsResponse, prescriptionsResponse, invoiceResponse] =
          await Promise.all([
            api.get(`/lab-requests/visit/${currentVisit.id}`),
            api.get(`/prescriptions/visit/${currentVisit.id}`),
            api.get(`/invoices/visit/${currentVisit.id}`),
          ]);

        return {
          patientData: patient,
          visitsData: visits,
          currentVisit,
          labTestsData: labTestsResponse.data.items as LabTest[],
          prescriptionsData: prescriptionsResponse.data
            .items as PrescriptionItem[],
          invoiceData: invoiceResponse.data.invoice as Invoice,
        };
      }

      return {
        patientData: patient,
        visitsData: visits,
        currentVisit: undefined,
        labTestsData: [],
        prescriptionsData: [],
        invoiceData: undefined,
      };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes - cache this detail page data
  });

  // Extract all data from the combined query
  const {
    patientData,
    visitsData,
    currentVisit,
    labTestsData = [],
    prescriptionsData = [],
    invoiceData,
  } = combinedData || {};
  const patientLoading = coreDataLoading;

  // Calculate totals
  const currentLabTestsCount = labTestsData?.length || 0;
  const currentLabTestsCompleted =
    labTestsData?.every((t) => t.status === "COMPLETED") || false;
  const currentLabTestsTotal =
    labTestsData?.reduce((sum, t) => sum + t.price, 0) || 0;

  const currentPrescriptionsCount = prescriptionsData?.length || 0;
  const currentPrescriptionsDispensed =
    prescriptionsData?.every((p) => p.dispensed) || false;
  const currentPrescriptionsTotal =
    prescriptionsData?.reduce((sum, p) => sum + p.price * p.quantity, 0) || 0;

  const consultationFee = currentVisit?.consultationFee || 0;
  const currentStayTotal = currentVisit?.admissionDate
    ? (currentVisit.dailyRate || 0) * (currentVisit.stayDuration || 0)
    : 0;

  const subtotal =
    consultationFee +
    currentLabTestsTotal +
    currentPrescriptionsTotal +
    currentStayTotal;
  const discount = invoiceData?.discount || 0;
  const totalCost = invoiceData?.total || subtotal - discount;
  const currentInvoice = invoiceData;

  if (patientLoading) return <div>Loading...</div>;
  if (!patientData) return <div>Patient not found</div>;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "error";
      case "CONSULTING":
        return "info";
      default:
        return "warning";
    }
  };

  return (
    <Box sx={{ width: "100%", mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => navigate("/patients")}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4">
              {patientData.firstName} {patientData.lastName}
            </Typography>
            <Chip
              label={patientData.isActive ? "Active" : "Inactive"}
              color={patientData.isActive ? "success" : "error"}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => {
                /* Create new visit */
              }}
            >
              New Visit
            </Button>
            {/* Admit/Discharge buttons - only show if there's an active inpatient visit */}
            {currentVisit && currentVisit.visitType === "INPATIENT" && (
              <>
                {!currentVisit.admissionDate && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      // Admit patient logic - would open a dialog to enter room number and daily rate
                      alert(
                        "Admit patient functionality - would open admission dialog",
                      );
                    }}
                  >
                    Admit Patient
                  </Button>
                )}
                {currentVisit.admissionDate && !currentVisit.dischargeDate && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => {
                      // Discharge patient logic
                      alert(
                        "Discharge patient functionality - stay duration will be calculated automatically",
                      );
                    }}
                  >
                    Discharge Patient
                  </Button>
                )}
              </>
            )}
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={() => window.print()}
            >
              Print Card
            </Button>
          </Box>
        </Box>

        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ mb: 4 }}
        >
          <Tab label="Patient Information" />
          <Tab label="Visit History" />
          <Tab label="Medical Records" />
        </Tabs>

        {tabValue === 0 && (
          <Grid container spacing={4}>
            {/* Patient Card Header */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 4, backgroundColor: "#fafafa" }}>
                <Box sx={{ textAlign: "center", mb: 3 }}>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", color: "#1976d2" }}
                  >
                    BETTER LIFE CLINIC
                  </Typography>
                  <Typography variant="subtitle1">
                    Patient Digital Card
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Card Generated: {new Date().toLocaleDateString()}
                  </Typography>
                </Box>

                {/* Biographical & Contact Information */}
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ borderBottom: "1px solid #e0e0e0", pb: 1 }}
                    >
                      Biographical & Contact Information
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Patient Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {patientData.patientNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Full Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {patientData.firstName} {patientData.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      National ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {patientData.nationalId || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Date of Birth
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDate(patientData.dateOfBirth)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {patientData.phone}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {patientData.email || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {patientData.address || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Next of Kin
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {patientData.nextOfKinName || "N/A"}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Current Visit Charges Section - Auto-updates */}
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ borderBottom: "1px solid #e0e0e0", pb: 1 }}
                    >
                      Current Visit Charges (Real-time Updates)
                    </Typography>
                  </Grid>

                  {/* Consultation Fees */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
                            Consultation
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Doctor's consultation fees
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Chip
                            label={
                              currentVisit?.consultation ? "Updated" : "Pending"
                            }
                            color={
                              currentVisit?.consultation ? "success" : "warning"
                            }
                            size="small"
                          />
                          <Typography
                            variant="h6"
                            sx={{ mt: 1, fontWeight: "bold" }}
                          >
                            $
                            {currentVisit?.consultationFee?.toFixed(2) ||
                              "0.00"}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>

                  {/* Lab Tests Fees */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
                            Lab Tests
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {currentLabTestsCount || 0} test(s) ordered
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Chip
                            label={
                              currentLabTestsCompleted ? "Updated" : "Pending"
                            }
                            color={
                              currentLabTestsCompleted ? "success" : "warning"
                            }
                            size="small"
                          />
                          <Typography
                            variant="h6"
                            sx={{ mt: 1, fontWeight: "bold" }}
                          >
                            ${currentLabTestsTotal?.toFixed(2) || "0.00"}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>

                  {/* Prescription Fees */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
                            Prescriptions
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {currentPrescriptionsCount || 0} medication(s)
                            prescribed
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Chip
                            label={
                              currentPrescriptionsDispensed
                                ? "Updated"
                                : "Pending"
                            }
                            color={
                              currentPrescriptionsDispensed
                                ? "success"
                                : "warning"
                            }
                            size="small"
                          />
                          <Typography
                            variant="h6"
                            sx={{ mt: 1, fontWeight: "bold" }}
                          >
                            ${currentPrescriptionsTotal?.toFixed(2) || "0.00"}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>

                  {/* Inpatient Stay Fees (if admitted) */}
                  {currentVisit?.admissionDate && (
                    <Grid item xs={12} md={6}>
                      <Card
                        variant="outlined"
                        sx={{ p: 2, mb: 2, borderColor: "#1976d2" }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600, color: "#1976d2" }}
                            >
                              Inpatient Stay
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Room {currentVisit.roomNumber} |{" "}
                              {currentVisit.stayDuration || 0} days
                              {!currentVisit.dischargeDate &&
                                " - Currently admitted"}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Chip
                              label={
                                currentVisit.dischargeDate
                                  ? "Finalized"
                                  : "Active"
                              }
                              color={
                                currentVisit.dischargeDate
                                  ? "success"
                                  : "primary"
                              }
                              size="small"
                            />
                            <Typography
                              variant="h6"
                              sx={{
                                mt: 1,
                                fontWeight: "bold",
                                color: "#1976d2",
                              }}
                            >
                              ${currentStayTotal?.toFixed(2) || "0.00"}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Total Cost Summary */}
                <Grid container justifyContent="flex-end">
                  <Grid item xs={12} md={4}>
                    <Paper
                      elevation={2}
                      sx={{ p: 3, backgroundColor: "#e3f2fd" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography>Subtotal:</Typography>
                        <Typography>
                          ${subtotal?.toFixed(2) || "0.00"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography>Discount:</Typography>
                        <Typography>
                          ${discount?.toFixed(2) || "0.00"}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                          Total:
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: "bold", color: "#1976d2" }}
                        >
                          ${totalCost?.toFixed(2) || "0.00"}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2, textAlign: "center" }}>
                        <Chip
                          label={currentInvoice?.status || "UNPAID"}
                          color={
                            currentInvoice?.status === "PAID"
                              ? "success"
                              : "error"
                          }
                          sx={{ fontWeight: "bold" }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Original medical information section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Medical Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Blood Group</Typography>
                  <Typography>{patientData.bloodGroup || "N/A"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Allergies</Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}
                  >
                    {patientData.allergies.length > 0 ? (
                      patientData.allergies.map((allergy) => (
                        <Chip
                          key={allergy}
                          label={allergy}
                          color="error"
                          size="small"
                        />
                      ))
                    ) : (
                      <Typography>N/A</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">
                    Insurance Provider
                  </Typography>
                  <Typography>
                    {patientData.insuranceProvider || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Insurance Number</Typography>
                  <Typography>
                    {patientData.insuranceNumber || "N/A"}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Visit Date</TableCell>
                  <TableCell>Visit Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visitsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : !visitsData || visitsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No visits found
                    </TableCell>
                  </TableRow>
                ) : (
                  visitsData.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>{formatDate(visit.visitDate)}</TableCell>
                      <TableCell>{visit.visitType}</TableCell>
                      <TableCell>
                        <Chip
                          label={visit.status}
                          color={getStatusColor(visit.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => navigate(`/visits/${visit.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 2 && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              Medical records timeline will be implemented in Phase 3
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PatientDetailPage;
