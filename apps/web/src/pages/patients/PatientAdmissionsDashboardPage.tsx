import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

interface AdmissionVisit {
  id: string;
  patient: {
    firstName: string;
    lastName: string;
    patientNumber: string;
  };
  ward: string | null;
  bedNumber: string | null;
  admissionDate: string | null;
  expectedDischargeDate: string | null;
  status: string;
}

const PatientAdmissionsDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAdmit = ["ADMINISTRATOR", "DOCTOR"].includes(user?.role.name ?? "");
  const {
    data: admissions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admissions"],
    queryFn: async () => {
      const response = await api.get("/visits", {
        params: { status: "ADMITTED", limit: 100 },
      });
      return (response.data.visits ?? []) as AdmissionVisit[];
    },
  });

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, letterSpacing: "-0.025em" }}>
            Patient Admissions
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Current inpatients and ward placements
          </Typography>
        </Box>
        {canAdmit && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate("/patients/admissions/new")}
          >
            Admit a Patient
          </Button>
        )}
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Admissions could not be loaded. Please refresh the page and try again.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: { xs: 1.75, sm: 2.25 },
            borderBottom: 1,
            borderColor: "divider",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Current inpatients
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ward placements and expected discharge dates
            </Typography>
          </Box>
          <Chip
            label={`${isLoading ? "—" : admissions.length} admitted`}
            color="primary"
            variant="outlined"
            sx={{ flexShrink: 0, fontWeight: 600 }}
          />
        </Box>
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Patient number</TableCell>
                  <TableCell>Ward</TableCell>
                  <TableCell>Bed</TableCell>
                  <TableCell>Admitted</TableCell>
                  <TableCell>Expected discharge</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={26} />
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Inpatient records are unavailable.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : admissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">
                        No patients are currently admitted.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  admissions.map((admission) => (
                    <TableRow key={admission.id} hover>
                      <TableCell>
                        {admission.patient.firstName} {admission.patient.lastName}
                      </TableCell>
                      <TableCell>{admission.patient.patientNumber}</TableCell>
                      <TableCell>{admission.ward || "—"}</TableCell>
                      <TableCell>{admission.bedNumber || "—"}</TableCell>
                      <TableCell>
                        {admission.admissionDate
                          ? new Date(admission.admissionDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {admission.expectedDischargeDate
                          ? new Date(
                              admission.expectedDischargeDate,
                            ).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Chip label={admission.status} color="primary" size="small" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Box
          sx={{
            display: { xs: "grid", md: "none" },
            gap: 1.5,
            p: 1.5,
          }}
        >
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={26} />
            </Box>
          ) : isError ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              Inpatient records are unavailable.
            </Typography>
          ) : admissions.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              No patients are currently admitted.
            </Typography>
          ) : admissions.map((admission) => (
            <Paper
              key={admission.id}
              variant="outlined"
              sx={{ p: 1.75, borderColor: "divider", bgcolor: "background.default" }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                    {admission.patient.firstName} {admission.patient.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                    {admission.patient.patientNumber}
                  </Typography>
                </Box>
                <Chip label={admission.status} color="primary" size="small" sx={{ flexShrink: 0 }} />
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 1.25,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">Ward</Typography>
                  <Typography variant="body2">{admission.ward || "—"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Bed</Typography>
                  <Typography variant="body2">{admission.bedNumber || "—"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Admitted</Typography>
                  <Typography variant="body2">
                    {admission.admissionDate
                      ? new Date(admission.admissionDate).toLocaleDateString()
                      : "—"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Expected discharge</Typography>
                  <Typography variant="body2">
                    {admission.expectedDischargeDate
                      ? new Date(admission.expectedDischargeDate).toLocaleDateString()
                      : "—"}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default PatientAdmissionsDashboardPage;
