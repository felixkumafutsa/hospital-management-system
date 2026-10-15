import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack, CheckCircleOutline } from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import api from "../../services/api";

interface Visit {
  id: string;
  visitDate: string;
  status: string;
  reasonForVisit?: string | null;
  patient: {
    firstName: string;
    lastName: string;
    patientNumber: string;
  };
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: { name: string };
}

interface AdmissionWard {
  id: string;
  name: string;
  department: string;
  beds: Array<{ id: string; bedNumber: string }>;
}

interface AdmissionForm {
  visitId: string;
  ward: string;
  bedNumber: string;
  attendingDoctorId: string;
  expectedDischargeDate: string;
  dailyRate: string;
}

const dateInOneWeek = () => {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
};

const PatientAdmissionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AdmissionForm>({
    visitId: searchParams.get("visitId") ?? "",
    ward: "",
    bedNumber: "",
    attendingDoctorId: "",
    expectedDischargeDate: dateInOneWeek(),
    dailyRate: "",
  });

  const {
    data: visits = [],
    isLoading: visitsLoading,
    isError: visitsError,
  } = useQuery({
    queryKey: ["admission-visits"],
    queryFn: async () => {
      const response = await api.get("/visits", { params: { limit: 100 } });
      const result = (response.data.visits ?? []) as Visit[];
      return result.filter(
        (visit) => visit.status !== "ADMITTED" && visit.status !== "COMPLETED",
      );
    },
  });

  const {
    data: doctors = [],
    isLoading: doctorsLoading,
    isError: doctorsError,
  } = useQuery({
    queryKey: ["admission-doctors"],
    queryFn: async () => {
      const response = await api.get("/users", { params: { limit: 1000 } });
      const users = (response.data.data ?? []) as StaffMember[];
      return users.filter(
        (user) => user.isActive && user.role?.name === "DOCTOR",
      );
    },
  });

  const {
    data: wards = [],
    isLoading: wardsLoading,
    isError: wardsError,
  } = useQuery({
    queryKey: ["admission-available-wards"],
    queryFn: async () => {
      const response = await api.get("/visits/wards/available");
      if (!Array.isArray(response.data.wards)) {
        throw new Error("The available ward list response was invalid");
      }
      return response.data.wards as AdmissionWard[];
    },
  });

  const admissionMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ward: formData.ward.trim(),
        bedNumber: formData.bedNumber.trim(),
        attendingDoctorId: formData.attendingDoctorId,
        expectedDischargeDate: formData.expectedDischargeDate
          ? new Date(formData.expectedDischargeDate).toISOString()
          : undefined,
        dailyRate: Number(formData.dailyRate),
      };
      return api.put(`/visits/${formData.visitId}/admit`, payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admissions"] }),
        queryClient.invalidateQueries({ queryKey: ["admission-visits"] }),
        queryClient.invalidateQueries({ queryKey: ["visits"] }),
        queryClient.invalidateQueries({ queryKey: ["admission-available-wards"] }),
      ]);
      await Swal.fire("Admitted", "The patient has been admitted.", "success");
      navigate("/patients/admissions");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;
      void Swal.fire(
        "Admission failed",
        message || "Unable to admit this patient. Check the details and try again.",
        "error",
      );
    },
  });

  const updateField = (name: keyof AdmissionForm, value: string) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const selectedVisit = visits.find((visit) => visit.id === formData.visitId);
  const selectedWard = wards.find((ward) => ward.id === formData.ward);
  const canSubmit =
    Boolean(formData.visitId) &&
    Boolean(selectedWard) &&
    Boolean(selectedWard?.beds.some((bed) => bed.bedNumber === formData.bedNumber)) &&
    Boolean(formData.attendingDoctorId) &&
    Number(formData.dailyRate) > 0 &&
    !visitsLoading &&
    !doctorsLoading &&
    !wardsLoading &&
    !visitsError &&
    !doctorsError &&
    !wardsError;

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column-reverse", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, letterSpacing: "-0.025em" }}>
            Admit a Patient
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Select a registered visit and assign its inpatient care details.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/patients/admissions")}
        >
          Back to admissions
        </Button>
      </Box>

      {visitsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Existing visits could not be loaded. Please try again.
        </Alert>
      )}
      {doctorsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Doctor list could not be loaded. Please try again.
        </Alert>
      )}
      {wardsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Available wards and beds could not be loaded. Please refresh the page
          and try again.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Box sx={{ mb: 0.25 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Visit details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose the registered visit that will be admitted.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required disabled={visitsLoading}>
              <InputLabel id="admission-visit-label">Existing visit</InputLabel>
              <Select
                labelId="admission-visit-label"
                label="Existing visit"
                value={formData.visitId}
                onChange={(event) => updateField("visitId", event.target.value)}
              >
                {visits.map((visit) => (
                  <MenuItem key={visit.id} value={visit.id}>
                    {visit.patient.firstName} {visit.patient.lastName} (
                    {visit.patient.patientNumber}) ·{" "}
                    {new Date(visit.visitDate).toLocaleDateString()} ·{" "}
                    {visit.status.replace(/_/g, " ")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {visitsLoading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Loading eligible visits…
                </Typography>
              </Box>
            )}
            {!visitsLoading && visits.length === 0 && !visitsError && (
              <Alert severity="info" sx={{ mt: 1.5 }}>
                No eligible visits are available. Register a visit before
                starting an admission.
              </Alert>
            )}
          </Grid>

          {selectedVisit && (
            <Grid item xs={12}>
              <Alert severity="info">
                Selected: {selectedVisit.patient.firstName}{" "}
                {selectedVisit.patient.lastName} ·{" "}
                {selectedVisit.patient.patientNumber}
                {selectedVisit.reasonForVisit
                  ? ` · ${selectedVisit.reasonForVisit}`
                  : ""}
              </Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ mb: 0.25 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Inpatient placement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Assign the ward, bed, and expected discharge date.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              required
              disabled={wardsLoading || wardsError || wards.length === 0}
            >
              <InputLabel id="admission-ward-label">Ward</InputLabel>
              <Select
                labelId="admission-ward-label"
                label="Ward"
                value={formData.ward}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    ward: event.target.value,
                    bedNumber: "",
                  }))
                }
              >
                {wards.map((ward) => (
                  <MenuItem key={ward.id} value={ward.id}>
                    {ward.name} · {ward.department} ({ward.beds.length} available)
                  </MenuItem>
                ))}
              </Select>
              {wardsLoading ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>
                  Loading available wards…
                </Typography>
              ) : wards.length === 0 && !wardsError ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>
                  No active wards have available beds.
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>
                  Choose an active ward with an available bed.
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              required
              disabled={!selectedWard || selectedWard.beds.length === 0}
            >
              <InputLabel id="admission-bed-label">Available bed</InputLabel>
              <Select
                labelId="admission-bed-label"
                label="Available bed"
                value={formData.bedNumber}
                onChange={(event) => updateField("bedNumber", event.target.value)}
              >
                {selectedWard?.beds.map((bed) => (
                  <MenuItem key={bed.id} value={bed.bedNumber}>
                    {bed.bedNumber}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>
                {selectedWard
                  ? "Only currently available beds in this ward are listed."
                  : "Select a ward first."}
              </Typography>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Expected discharge"
              type="datetime-local"
              value={formData.expectedDischargeDate}
              onChange={(event) =>
                updateField("expectedDischargeDate", event.target.value)
              }
              InputLabelProps={{ shrink: true }}
              helperText="Optional; defaults to seven days from admission."
            />
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ mb: 0.25 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Care team and rate
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select the attending doctor and set the daily inpatient rate.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={doctorsLoading}>
              <InputLabel id="attending-doctor-label">Attending doctor</InputLabel>
              <Select
                labelId="attending-doctor-label"
                label="Attending doctor"
                value={formData.attendingDoctorId}
                onChange={(event) =>
                  updateField("attendingDoctorId", event.target.value)
                }
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName}
                  </MenuItem>
                ))}
              </Select>
              {doctorsLoading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    Loading doctors…
                  </Typography>
                </Box>
              )}
              {!doctorsLoading && doctors.length === 0 && !doctorsError && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  No active doctors are available.
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Daily rate"
              type="number"
              value={formData.dailyRate}
              onChange={(event) => updateField("dailyRate", event.target.value)}
              inputProps={{ min: 0.01, step: 0.01 }}
            />
          </Grid>
        </Grid>

        {!canSubmit && !visitsLoading && !doctorsLoading && !wardsLoading && !visitsError && !doctorsError && !wardsError && (
          <Typography
            variant="body2"
            color="text.secondary"
            role="status"
            sx={{ mt: 2 }}
          >
            Select a visit, an available ward and bed, and complete the required
            doctor and daily rate fields to continue.
          </Typography>
        )}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            mt: 3,
          }}
        >
          <Button
            onClick={() => navigate("/patients/admissions")}
            disabled={admissionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={
              admissionMutation.isPending ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <CheckCircleOutline />
              )
            }
            onClick={() => admissionMutation.mutate()}
            disabled={!canSubmit || admissionMutation.isPending}
          >
            Confirm admission
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PatientAdmissionPage;
