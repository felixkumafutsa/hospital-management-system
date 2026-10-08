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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Drawer,
  Tooltip,
} from "@mui/material";
import { Print, ArrowBack, Add, Notes } from "@mui/icons-material";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useVisitDrawerStore } from "../../stores/visitDrawerStore";
import { formatCurrency } from "../../utils/currency";
import RecordVitalsDrawer from "../../components/RecordVitalsDrawer";
import ClinicalConsultationDrawer from "../../components/ClinicalConsultationDrawer";
import OrderLabTestDrawer from '../../components/OrderLabTestDrawer';
import PrescribeMedicationDrawer from '../../components/PrescribeMedicationDrawer';
import AdmitPatientModal from '../../components/AdmitPatientModal';
import DischargePatientModal from '../../components/DischargePatientModal';
import ConsultationDetails from '../../components/ConsultationDetails';

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
  consultation?: {
    id: string;
    consultationFee?: number | string | null;
    chiefComplaint?: string | null;
    historyOfPC?: string | null;
    examination?: string | null;
    clinicalNotes?: string | null;
    plan?: string | null;
    followUpNotes?: string | null;
  };
  admissionDate?: string;
  dischargeDate?: string;
  stayDuration?: number;
  roomNumber?: string;
  dailyRate?: number;
  reasonForVisit?: string;
  referralNote?: string;
  emergencyNotes?: string;
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
  items?: Array<{
    reference?: string | null;
    category: string;
    unitPrice: number | string;
    subtotal?: number | string;
  }>;
}

const PatientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);
  const [openVisitDialog, setOpenVisitDialog] = React.useState(false);
  const [vitalsDrawerOpen, setVitalsDrawerOpen] = React.useState(false);
  const [consultationDrawerOpen, setConsultationDrawerOpen] = React.useState(false);
  const [labTestDrawerOpen, setLabTestDrawerOpen] = React.useState(false);
  const [medicationDrawerOpen, setMedicationDrawerOpen] = React.useState(false);
  const [admitModalOpen, setAdmitModalOpen] = React.useState(false);
  const [dischargeModalOpen, setDischargeModalOpen] = React.useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = React.useState<string | null>(null);
  const [visitForm, setVisitForm] = React.useState({
    visitType: "OUTPATIENT",
    reasonForVisit: "",
    triageLevel: "MEDIUM",
    emergencyNotes: "",
  });
  const [visitError, setVisitError] = React.useState<string | null>(null);
  const { user } = useAuth();
  const { selectVisit, openDrawer } = useVisitDrawerStore();

  // Fetch core patient and visits data in parallel
  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name;
  const isReceptionRole = ["RECEPTIONIST", "RECEPTION_CASHIER", "CASHIER"].includes(
    roleName?.trim().toUpperCase() || "",
  );

  const { data: combinedData, isLoading: coreDataLoading, error: coreDataError } = useQuery({
    queryKey: ["patient-detail", id, user?.role?.name],
    queryFn: async () => {
      // Patient demographics should remain available even if visit history is unavailable.
      const patientResponse = await api.get(`/patients/${id}`);
      const patientPayload =
        patientResponse.data?.patient ??
        patientResponse.data?.data?.patient ??
        patientResponse.data?.data ??
        patientResponse.data;
      const patient = patientPayload as Patient | undefined;
      if (!patient) {
        throw new Error("Patient details were not included in the server response.");
      }

      const visitsResponse = await api.get(`/visits/patient/${id}`).catch(() => null);
      const visitsPayload =
        visitsResponse?.data?.visits ??
        visitsResponse?.data?.data?.visits ??
        visitsResponse?.data?.data?.data ??
        visitsResponse?.data?.data;
      const visits = (Array.isArray(visitsPayload) ? visitsPayload : []) as Visit[];

      // Find current active visit
      const currentVisit = visits.find(
        (v) => v.status !== "COMPLETED" && v.status !== "CANCELLED",
      );

      // If there's a current visit, fetch its related data in parallel too
      if (currentVisit?.id) {
        // Reception can open a patient profile, but does not have access to clinical endpoints.
        const clinicalResponses = isReceptionRole
          ? []
          : await Promise.allSettled([
              api.get(`/lab/requests/visit/${currentVisit.id}`),
              api.get(`/prescriptions/visit/${currentVisit.id}`),
              api.get(`/triage/visit/${currentVisit.id}`),
            ]);
        const labTestsResponse = clinicalResponses[0]?.status === "fulfilled"
          ? clinicalResponses[0].value
          : undefined;
        const prescriptionsResponse = clinicalResponses[1]?.status === "fulfilled"
          ? clinicalResponses[1].value
          : undefined;
        const vitalsResponse = clinicalResponses[2]?.status === "fulfilled"
          ? clinicalResponses[2].value
          : undefined;

        // Fetch invoice data separately with error handling (non-critical)
        let invoiceData: Invoice | undefined = undefined;
        try {
          const invoiceResponse = await api.get(`/finance/invoices/visit/${currentVisit.id}`);
          invoiceData = invoiceResponse.data?.invoice ?? invoiceResponse.data?.data ?? invoiceResponse.data;
        } catch (error) {
          // Invoice may not exist for new visits - this is OK
          console.log("Invoice not found for visit - this is expected for new visits");
        }

        const labItems = Array.isArray(labTestsResponse?.data?.items)
          ? labTestsResponse.data.items
          : Array.isArray(labTestsResponse?.data?.data)
            ? labTestsResponse.data.data
            : [];

        const prescriptionRecords = Array.isArray(prescriptionsResponse?.data?.items)
          ? prescriptionsResponse.data.items
          : Array.isArray(prescriptionsResponse?.data?.data)
            ? prescriptionsResponse.data.data
            : [];
        const prescriptionItems = prescriptionRecords.flatMap((prescription: any) => {
          const items = Array.isArray(prescription.items) ? prescription.items : [prescription];
          return items.map((item: any) => {
            const invoiceItem = invoiceData?.items?.find((line: any) =>
              line.reference === item.id && line.category === "MEDICATION",
            );
            return {
              id: item.id,
              medicineName: item.medicine?.name || item.medicineName || "Medication",
              quantity: Number(item.quantity || 0),
              price: Number(invoiceItem?.unitPrice || 0),
              dispensed: prescription.status === "DISPENSED" || item.dispensed === true,
            };
          });
        });

        const vitalsItems = Array.isArray(vitalsResponse?.data?.vitals)
          ? vitalsResponse.data.vitals
          : Array.isArray(vitalsResponse?.data?.data)
            ? vitalsResponse.data.data
            : [];

        return {
          patientData: patient,
          visitsData: visits,
          currentVisit,
          labTestsData: labItems as LabTest[],
          prescriptionsData: prescriptionItems as PrescriptionItem[],
          vitalsData: vitalsItems,
          invoiceData: invoiceData as Invoice | undefined,
        };
      }

      return {
        patientData: patient,
        visitsData: visits,
        currentVisit: undefined,
        labTestsData: [],
        prescriptionsData: [],
        vitalsData: [],
        invoiceData: undefined,
      };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes - cache this detail page data
  });

  // Mutation for creating a new visit
  const createVisitMutation = useMutation({
    mutationFn: async (formData: typeof visitForm) => {
      const response = await api.post("/visits", {
        patientId: id,
        visitType: formData.visitType,
        reasonForVisit: formData.reasonForVisit,
        triageLevel: formData.triageLevel,
        emergencyNotes: formData.emergencyNotes || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      // Close dialog and refresh patient data
      setOpenVisitDialog(false);
      setVisitForm({
        visitType: "OUTPATIENT",
        reasonForVisit: "",
        triageLevel: "MEDIUM",
        emergencyNotes: "",
      });
      setVisitError(null);
      // Refetch the patient data to show the new visit
      window.location.reload();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to create visit";
      setVisitError(message);
    },
  });

  // Extract all data from the combined query
  const {
    patientData,
    visitsData,
    currentVisit,
    labTestsData = [],
    prescriptionsData = [],
    vitalsData = [],
    invoiceData,
  } = combinedData || {};
  const patientLoading = coreDataLoading;

  const { data: pricingSettings } = useQuery({
    queryKey: ["system-pricing"],
    queryFn: async () => (await api.get("/settings/pricing")).data.settings,
  });

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

  const consultationFee = Number(
    currentVisit?.consultation?.consultationFee ?? pricingSettings?.consultationFee ?? 0,
  );
  const currentStayDays = currentVisit?.admissionDate
    ? currentVisit.stayDuration || Math.max(
        1,
        Math.ceil((Date.now() - new Date(currentVisit.admissionDate).getTime()) / (1000 * 60 * 60 * 24)),
      )
    : 0;
  const currentStayTotal = (currentVisit?.dailyRate || 0) * currentStayDays;

  const subtotal =
    consultationFee +
    currentLabTestsTotal +
    currentPrescriptionsTotal +
    currentStayTotal;
  const discount = invoiceData?.discount || 0;
  const totalCost = invoiceData?.total || subtotal - discount;
  const currentInvoice = invoiceData;

  if (patientLoading) return <div>Loading...</div>;
  if (!patientData) {
    return coreDataError ? (
      <Alert severity="error">
        Unable to load this patient profile: {(coreDataError as Error).message}
      </Alert>
    ) : (
      <div>Patient not found</div>
    );
  }

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
              onClick={() => setOpenVisitDialog(true)}
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
                    onClick={() => setAdmitModalOpen(true)}
                  >
                    Admit Patient
                  </Button>
                )}
                {currentVisit.admissionDate && !currentVisit.dischargeDate && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => setDischargeModalOpen(true)}
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

        {currentVisit && (
          <Box sx={{ my: 2, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Clinical Encounter Actions</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {user && user.role.name === 'NURSE' ? (
                <Button variant="contained" onClick={() => setVitalsDrawerOpen(true)}>Record Vitals</Button>
              ) : user && !['RECEPTIONIST', 'RECEPTION_CASHIER', 'CASHIER'].includes(user.role.name) ? (
                <>
                  <Button variant="contained" onClick={() => setVitalsDrawerOpen(true)}>Record Vitals</Button>
                  <Button variant="contained" onClick={() => setConsultationDrawerOpen(true)}>Clinical Consultation</Button>
                  <Button variant="contained" onClick={() => setLabTestDrawerOpen(true)}>Order Lab Test</Button>
                  <Button variant="contained" onClick={() => setMedicationDrawerOpen(true)}>Prescribe Medication</Button>
                </>
              ) : null}
            </Box>
          </Box>
        )}

        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label="Overview" />
          <Tab label="Visits" />
          <Tab label="Billing" />
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

                {/* Vitals Display Section */}
                {vitalsData && vitalsData.length > 0 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ borderBottom: "1px solid #e0e0e0", pb: 1 }}
                      >
                        Latest Vitals
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Temperature
                            </Typography>
                            <Typography variant="body1">
                              {vitalsData[0].temperature}°C
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Blood Pressure
                            </Typography>
                            <Typography variant="body1">
                              {vitalsData[0].bloodPressure}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Heart Rate
                            </Typography>
                            <Typography variant="body1">
                              {vitalsData[0].heartRate} bpm
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Respiratory Rate
                            </Typography>
                            <Typography variant="body1">
                              {vitalsData[0].respiratoryRate} breaths/min
                            </Typography>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  </Grid>
                )}

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
                              {formatCurrency(consultationFee)}
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
                            {formatCurrency(currentLabTestsTotal)}
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
                            {currentPrescriptionsCount || 0} item(s) prescribed
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
                            {formatCurrency(currentPrescriptionsTotal)}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>

                  {/* Inpatient Stay Fees */}
                  {currentVisit && currentVisit.visitType === "INPATIENT" && (
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
                              Inpatient Stay
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {currentVisit.stayDuration || 0} day(s) at{" "}
                              {formatCurrency(currentVisit.dailyRate)}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Chip
                              label={
                                currentVisit.dischargeDate
                                  ? "Finalized"
                                  : "Ongoing"
                              }
                              color={
                                currentVisit.dischargeDate
                                  ? "success"
                                  : "info"
                              }
                              size="small"
                            />
                            <Typography
                              variant="h6"
                              sx={{ mt: 1, fontWeight: "bold" }}
                            >
                              {formatCurrency(currentStayTotal)}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Financial Summary */}
                <Box sx={{ maxWidth: 400, ml: "auto", p: 2 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ textAlign: "right" }}
                  >
                    Financial Summary
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body1">Subtotal</Typography>
                    <Typography variant="body1">
                      {formatCurrency(subtotal)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body1">Discount</Typography>
                    <Typography variant="body1" color="error">
                      - {formatCurrency(discount)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      Total
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "primary.main" }}
                    >
                      {formatCurrency(totalCost)}
                    </Typography>
                  </Box>
                  <Chip
                    label={currentInvoice?.status || "UNPAID"}
                    color={
                      currentInvoice?.status === "PAID" ? "success" : "warning"
                    }
                    size="small"
                    sx={{ float: "right", mt: 1 }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Visit Date</TableCell>
                  <TableCell>Visit Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Visit Notes</TableCell>
                  <TableCell>Actions</TableCell>
                  <TableCell>Consultation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visitsData?.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>{formatDate(visit.visitDate)}</TableCell>
                    <TableCell>{visit.visitType}</TableCell>
                    <TableCell>
                      <Chip
                        label={visit.status}
                        color={getStatusColor(visit.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        arrow
                        placement="top"
                        title={(() => {
                          const notes = [
                            ["Visit reason", visit.reasonForVisit],
                            ["Referral", visit.referralNote],
                            ["Emergency", visit.emergencyNotes],
                            ["Chief complaint", visit.consultation?.chiefComplaint],
                            ["History", visit.consultation?.historyOfPC],
                            ["Examination", visit.consultation?.examination],
                            ["Clinical notes", visit.consultation?.clinicalNotes],
                            ["Plan", visit.consultation?.plan],
                            ["Follow-up", visit.consultation?.followUpNotes],
                          ].filter(([, note]) => typeof note === "string" && note.trim());

                          return notes.length ? (
                            <Box sx={{ py: 0.5 }}>
                              {notes.map(([label, note]) => (
                                <Typography key={label} variant="body2" sx={{ mb: 0.5, whiteSpace: "pre-wrap" }}>
                                  <strong>{label}:</strong> {note}
                                </Typography>
                              ))}
                            </Box>
                          ) : "No visit notes recorded";
                        })()}
                      >
                        <IconButton size="small" aria-label="View visit notes">
                          <Notes fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => {
                          selectVisit(visit.id);
                          openDrawer();
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                    <TableCell>
                      {visit.consultation && (
                        <Button
                          size="small"
                          onClick={() => setSelectedConsultationId(visit.consultation?.id || null)}
                        >
                          View Consultation
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 2 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Billing Details</Typography>
            <Typography>
              This section will show a detailed breakdown of all invoices and
              payments for the patient.
            </Typography>
          </Box>
        )}

        <Dialog open={openVisitDialog} onClose={() => setOpenVisitDialog(false)}>
          <DialogTitle>Create New Visit</DialogTitle>
          <DialogContent>
            {visitError && <Alert severity="error">{visitError}</Alert>}
            <FormControl component="fieldset" margin="normal">
              <FormLabel component="legend">Visit Type</FormLabel>
              <RadioGroup
                row
                value={visitForm.visitType}
                onChange={(e) =>
                  setVisitForm({ ...visitForm, visitType: e.target.value })
                }
              >
                <FormControlLabel
                  value="OUTPATIENT"
                  control={<Radio />}
                  label="Outpatient"
                />
                <FormControlLabel
                  value="INPATIENT"
                  control={<Radio />}
                  label="Inpatient"
                />
              </RadioGroup>
            </FormControl>
            <TextField
              autoFocus
              margin="dense"
              label="Reason for Visit"
              type="text"
              fullWidth
              variant="outlined"
              value={visitForm.reasonForVisit}
              onChange={(e) =>
                setVisitForm({ ...visitForm, reasonForVisit: e.target.value })
              }
            />
            {visitForm.visitType === "INPATIENT" && (
              <>
                <FormControl component="fieldset" margin="normal">
                  <FormLabel component="legend">Triage Level</FormLabel>
                  <RadioGroup
                    row
                    value={visitForm.triageLevel}
                    onChange={(e) =>
                      setVisitForm({
                        ...visitForm,
                        triageLevel: e.target.value,
                      })
                    }
                  >
                    <FormControlLabel
                      value="LOW"
                      control={<Radio />}
                      label="Low"
                    />
                    <FormControlLabel
                      value="MEDIUM"
                      control={<Radio />}
                      label="Medium"
                    />
                    <FormControlLabel
                      value="HIGH"
                      control={<Radio />}
                      label="High"
                    />
                  </RadioGroup>
                </FormControl>
                <TextField
                  margin="dense"
                  label="Emergency Notes"
                  type="text"
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  value={visitForm.emergencyNotes}
                  onChange={(e) =>
                    setVisitForm({
                      ...visitForm,
                      emergencyNotes: e.target.value,
                    })
                  }
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenVisitDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createVisitMutation.mutate(visitForm)}
              disabled={createVisitMutation.isPending}
            >
              {createVisitMutation.isPending ? "Creating..." : "Create Visit"}
            </Button>
          </DialogActions>
        </Dialog>

        <RecordVitalsDrawer
        open={vitalsDrawerOpen}
        onClose={() => setVitalsDrawerOpen(false)}
        visitId={currentVisit?.id || ""}
        patientName={`${patientData.firstName} ${patientData.lastName}`}
      />
      <ClinicalConsultationDrawer
        open={consultationDrawerOpen}
        onClose={() => setConsultationDrawerOpen(false)}
        visitId={currentVisit?.id || ""}
        patientName={`${patientData.firstName} ${patientData.lastName}`}
        patientId={patientData.id}
      />
      {currentVisit && (
      <OrderLabTestDrawer
        open={labTestDrawerOpen}
        onClose={() => setLabTestDrawerOpen(false)}
        visitId={currentVisit.id}
        patientName={`${patientData.firstName} ${patientData.lastName}`}
        patientId={patientData.id}
      />
      )}

        <PrescribeMedicationDrawer
          open={medicationDrawerOpen}
          onClose={() => setMedicationDrawerOpen(false)}
          visitId={currentVisit?.id || ''}
          patientName={`${patientData.firstName} ${patientData.lastName}`}
        />

        <AdmitPatientModal
          open={admitModalOpen}
          onClose={() => setAdmitModalOpen(false)}
          visitId={currentVisit?.id || ''}
          patientName={`${patientData.firstName} ${patientData.lastName}`}
        />

        <DischargePatientModal
          open={dischargeModalOpen}
          onClose={() => setDischargeModalOpen(false)}
          visitId={currentVisit?.id || ''}
          patientName={`${patientData.firstName} ${patientData.lastName}`}
        />

        <Drawer
          anchor="right"
          open={!!selectedConsultationId}
          onClose={() => setSelectedConsultationId(null)}
          sx={{ '& .MuiDrawer-paper': { width: '50%', p: 2 } }}
        >
          {selectedConsultationId && (
            <ConsultationDetails
              consultationId={selectedConsultationId}
              onClose={() => setSelectedConsultationId(null)}
            />
          )}
        </Drawer>
      </Paper>
    </Box>
  );
};

export default PatientDetailPage;
