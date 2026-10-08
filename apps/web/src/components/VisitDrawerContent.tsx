import {
  Box,
  Typography,
  Divider,
  Paper,
  Chip,
  Grid,
  CircularProgress,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useVisitDrawerStore } from "../stores/visitDrawerStore";
import api from "../services/api";
// Import bank note icon for currency display - matches project's billing needs
import { AttachMoney } from "@mui/icons-material";
import { formatCurrency } from "../utils/currency";

interface VisitDetails {
  id: string;
  visitDate: string;
  visitType: string;
  status: string;
  consultation?: { id: string; consultationFee?: number | string | null };
  admissionDate?: string;
  dischargeDate?: string;
  stayDuration?: number;
  roomNumber?: string;
  ward?: string;
  bedNumber?: string;
  dailyRate?: number;
  reasonForVisit?: string;
  triageLevel?: string;
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

const VisitDrawerContent = () => {
  const { selectedVisitId } = useVisitDrawerStore();

  // Fetch visit details
  const { data: visitData, isLoading: visitLoading } = useQuery({
    queryKey: ["visit-details", selectedVisitId],
    queryFn: async () => {
      if (!selectedVisitId) return null;
      const response = await api.get(`/visits/${selectedVisitId}`);
      return response.data.visit as VisitDetails;
    },
    enabled: !!selectedVisitId,
  });

  // Fetch related lab tests if we have a visit
  const { data: labTests = [] } = useQuery({
    queryKey: ["visit-lab-tests", selectedVisitId],
    queryFn: async () => {
      if (!selectedVisitId) return [];
      const response = await api.get(`/lab/requests/visit/${selectedVisitId}`);
      const items = Array.isArray(response.data?.items)
        ? response.data.items
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];
      return items as LabTest[];
    },
    enabled: !!selectedVisitId,
  });

  // Fetch related prescriptions
  const { data: prescriptions = [] } = useQuery({
    queryKey: ["visit-prescriptions", selectedVisitId],
    queryFn: async () => {
      if (!selectedVisitId) return [];
      const response = await api.get(`/prescriptions/visit/${selectedVisitId}`);
      const items = Array.isArray(response.data?.items)
        ? response.data.items
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];
      return items as PrescriptionItem[];
    },
    enabled: !!selectedVisitId,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
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

  const getTriageColor = (level?: string) => {
    switch (level) {
      case "LOW":
        return "success";
      case "MEDIUM":
        return "warning";
      case "HIGH":
        return "error";
      case "CRITICAL":
        return "error";
      default:
        return "default";
    }
  };

  if (!selectedVisitId) {
    return (
      <Box sx={{ width: 450, p: 4, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          No visit selected
        </Typography>
      </Box>
    );
  }

  if (visitLoading) {
    return (
      <Box sx={{ width: 450, p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!visitData) {
    return (
      <Box sx={{ width: 450, p: 4, textAlign: "center" }}>
        <Typography variant="body1" color="error">
          Visit not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: 450, p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Visit Details
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        ID: {visitData.id}
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Basic Visit Information */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Visit Date
            </Typography>
            <Typography variant="body1">{formatDate(visitData.visitDate)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Visit Type
            </Typography>
            <Typography variant="body1">{visitData.visitType}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Box>
              <Chip
                label={visitData.status}
                color={getStatusColor(visitData.status) as any}
                size="small"
              />
            </Box>
          </Grid>
          {visitData.triageLevel && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Triage Level
              </Typography>
              <Box>
                <Chip
                  label={visitData.triageLevel}
                  color={getTriageColor(visitData.triageLevel) as any}
                  size="small"
                />
              </Box>
            </Grid>
          )}
        </Grid>

        {visitData.consultation?.consultationFee != null && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">Consultation Fee</Typography>
            <Typography variant="body1">{formatCurrency(visitData.consultation.consultationFee)}</Typography>
          </>
        )}

        {visitData.reasonForVisit && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Reason for Visit
            </Typography>
            <Typography variant="body1">{visitData.reasonForVisit}</Typography>
          </>
        )}

        {visitData.emergencyNotes && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Emergency Notes
            </Typography>
            <Typography variant="body1">{visitData.emergencyNotes}</Typography>
          </>
        )}
      </Paper>

      {/* Inpatient details if applicable */}
      {visitData.visitType === "INPATIENT" && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Inpatient Stay Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Admission Date
              </Typography>
              <Typography variant="body1">{formatDate(visitData.admissionDate)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Discharge Date
              </Typography>
              <Typography variant="body1">{formatDate(visitData.dischargeDate)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Room Number
              </Typography>
              <Typography variant="body1">{visitData.ward || "N/A"} / {visitData.bedNumber || visitData.roomNumber || "N/A"}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Stay Duration
              </Typography>
              <Typography variant="body1">
                {visitData.stayDuration ? `${visitData.stayDuration} days` : "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Lab Tests */}
      {labTests.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Lab Tests ({labTests.length})
          </Typography>
          {labTests.map((test) => (
            <Box key={test.id} sx={{ mb: 2, pb: 2, borderBottom: "1px solid #e0e0e0" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body1">{test.testName}</Typography>
                <Chip label={test.status} size="small" />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AttachMoney fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(test.price)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {/* Prescriptions */}
      {prescriptions.length > 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Prescriptions ({prescriptions.length})
          </Typography>
          {prescriptions.map((item) => (
            <Box key={item.id} sx={{ mb: 2, pb: 2, borderBottom: "1px solid #e0e0e0" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body1">{item.medicineName}</Typography>
                <Chip
                  label={item.dispensed ? "Dispensed" : "Pending"}
                  color={item.dispensed ? "success" : "warning"}
                  size="small"
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AttachMoney fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Qty: {item.quantity} | {formatCurrency(item.price * item.quantity)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default VisitDrawerContent;