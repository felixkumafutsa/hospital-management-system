import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, DeleteOutline, Edit, Search, Visibility } from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import ConsultationDetails from "../../components/ConsultationDetails";

type DiagnosisType = "PRIMARY" | "SECONDARY" | "DIFFERENTIAL";
type FollowUpStatus = "SCHEDULED" | "COMPLETED" | "MISSED";

interface DiagnosisForm {
  icd10Code: string;
  icd10Desc: string;
  diagnosisType: DiagnosisType;
  notes: string;
}

interface ConsultationForm {
  visitId: string;
  chiefComplaint: string;
  historyOfPC: string;
  examination: string;
  clinicalNotes: string;
  plan: string;
  followUpDate: string;
  followUpNotes: string;
  followUpStatus: FollowUpStatus;
  assignedDoctorId: string;
  diagnoses: DiagnosisForm[];
  complete: boolean;
}

const emptyForm = (): ConsultationForm => ({
  visitId: "",
  chiefComplaint: "",
  historyOfPC: "",
  examination: "",
  clinicalNotes: "",
  plan: "",
  followUpDate: "",
  followUpNotes: "",
  followUpStatus: "SCHEDULED",
  assignedDoctorId: "",
  diagnoses: [],
  complete: false,
});

const errorMessage = (error: any) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  error?.message ||
  "Unable to save the consultation. Please try again.";

const ConsultationsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [form, setForm] = useState<ConsultationForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const queryClient = useQueryClient();

  const { data: visits = [], isLoading, isError } = useQuery({
    queryKey: ["consultations"],
    queryFn: async () => {
      const response = await api.get("/visits");
      return (response.data.visits || []).map((visit: any) => ({
        id: visit.id,
        consultationId: visit.consultation?.id,
        consultationNumber: `CON-${visit.id.slice(0, 8).toUpperCase()}`,
        patientName:
          `${visit.patient?.firstName || ""} ${visit.patient?.lastName || ""}`.trim() || "Unknown",
        doctorName: visit.consultation?.doctor
          ? `${visit.consultation.doctor.firstName} ${visit.consultation.doctor.lastName}`
          : "Unassigned",
        date: visit.visitDate,
        status: visit.status,
        symptoms: visit.consultation?.chiefComplaint || "N/A",
        diagnosis: (visit.consultation?.diagnoses || [])
          .map((diagnosis: any) => diagnosis.icd10Desc)
          .filter(Boolean)
          .join(", ") || "N/A",
        hasConsultation: Boolean(visit.consultation),
        consultation: visit.consultation,
      }));
    },
  });

  const { data: visitsForForm = [], isLoading: visitsLoading, isError: visitsError } = useQuery({
    queryKey: ["consultation-available-visits"],
    queryFn: async () => {
      const response = await api.get("/visits");
      return (response.data.visits || []).filter((visit: any) => !visit.consultation);
    },
    enabled: drawerOpen,
  });

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
    queryKey: ["consultation-doctors"],
    queryFn: async () => {
      const response = await api.get("/users");
      return (response.data.data || []).filter((staff: any) => staff.role?.name === "DOCTOR");
    },
    enabled: drawerOpen,
  });

  const createConsultationMutation = useMutation({
    mutationFn: async (values: ConsultationForm) => {
      const payload: Record<string, unknown> = {
        visitId: values.visitId,
        chiefComplaint: values.chiefComplaint.trim(),
        historyOfPC: values.historyOfPC.trim() || undefined,
        examination: values.examination.trim() || undefined,
        clinicalNotes: values.clinicalNotes.trim() || undefined,
        plan: values.plan.trim() || undefined,
        followUpDate: values.followUpDate
          ? new Date(`${values.followUpDate}T00:00:00`).toISOString()
          : undefined,
        followUpNotes: values.followUpNotes.trim() || undefined,
        followUpStatus: values.followUpStatus || undefined,
        assignedDoctorId: values.assignedDoctorId || undefined,
        diagnoses: values.diagnoses
          .filter((diagnosis) => diagnosis.icd10Desc.trim())
          .map((diagnosis) => ({
            icd10Code: diagnosis.icd10Code.trim() || "N/A",
            icd10Desc: diagnosis.icd10Desc.trim(),
            diagnosisType: diagnosis.diagnosisType,
            notes: diagnosis.notes.trim() || undefined,
          })),
      };
      if (values.complete) payload.status = "COMPLETED";
      return api.post("/consultations", payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["consultations"] }),
        queryClient.invalidateQueries({ queryKey: ["consultation-available-visits"] }),
        queryClient.invalidateQueries({ queryKey: ["visits"] }),
        queryClient.invalidateQueries({ queryKey: ["appointments"] }),
      ]);
      setDrawerOpen(false);
      setForm(emptyForm());
      setFormError("");
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  const filteredVisits = useMemo(() => visits.filter((visit: any) => {
    const needle = searchTerm.toLowerCase();
    return (
      visit.patientName.toLowerCase().includes(needle) ||
      visit.doctorName.toLowerCase().includes(needle) ||
      visit.consultationNumber.toLowerCase().includes(needle) ||
      visit.status.toLowerCase().includes(needle)
    );
  }), [visits, searchTerm]);

  const closeForm = () => {
    if (createConsultationMutation.isPending) return;
    setDrawerOpen(false);
    setForm(emptyForm());
    setFormError("");
  };

  const openEdit = (visit: any) => {
    const consultation = visit.consultation;
    if (!consultation) return;
    const date = consultation.followUpDate
      ? new Date(consultation.followUpDate).toISOString().slice(0, 10)
      : "";
    setForm({
      visitId: visit.id,
      chiefComplaint: consultation.chiefComplaint || "",
      historyOfPC: consultation.historyOfPC || "",
      examination: consultation.examination || "",
      clinicalNotes: consultation.clinicalNotes || "",
      plan: consultation.plan || "",
      followUpDate: date,
      followUpNotes: consultation.followUpNotes || "",
      followUpStatus: consultation.followUpStatus || "SCHEDULED",
      assignedDoctorId: consultation.assignedDoctorId || "",
      diagnoses: (consultation.diagnoses || []).map((diagnosis: any) => ({
        icd10Code: diagnosis.icd10Code || "",
        icd10Desc: diagnosis.icd10Desc || "",
        diagnosisType: diagnosis.diagnosisType || "PRIMARY",
        notes: diagnosis.notes || "",
      })),
      complete: visit.status === "AWAITING_PAYMENT",
    });
    setFormError("");
    setDrawerOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!form.visitId || !form.chiefComplaint.trim()) {
      setFormError("Select a visit and enter the chief complaint.");
      return;
    }
    createConsultationMutation.mutate(form);
  };

  const updateDiagnosis = (index: number, values: Partial<DiagnosisForm>) => {
    setForm((current) => ({
      ...current,
      diagnoses: current.diagnoses.map((diagnosis, itemIndex) =>
        itemIndex === index ? { ...diagnosis, ...values } : diagnosis,
      ),
    }));
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: "100%", boxSizing: "border-box" }}>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 600 }}>Consultations</Typography>
          <Typography color="text.secondary">Record clinical findings and follow-up for a patient visit.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDrawerOpen(true)}>
          New Consultation
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search patient, doctor, visit, or status"
          value={searchTerm}
          onChange={(event) => { setSearchTerm(event.target.value); setPage(0); }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} /> }}
        />
      </Paper>

      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}><CircularProgress /></Box>
        ) : isError ? (
          <Alert severity="error" sx={{ m: 2 }}>Consultations could not be loaded. Refresh and try again.</Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Visit</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Chief complaint</TableCell>
                    <TableCell>Visit status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredVisits.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((visit: any) => (
                    <TableRow key={visit.id} hover>
                      <TableCell sx={{ fontFamily: "monospace" }}>{visit.consultationNumber}</TableCell>
                      <TableCell>{visit.patientName}</TableCell>
                      <TableCell>{visit.doctorName}</TableCell>
                      <TableCell>{visit.date ? new Date(visit.date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>{visit.symptoms}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={visit.status}
                          color={visit.status === "AWAITING_PAYMENT" ? "success" : visit.status === "CANCELLED" ? "error" : "primary"}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Tooltip title={visit.consultationId ? "View consultation" : "No consultation recorded for this visit"}>
                            <IconButton
                              size="small"
                              disabled={!visit.consultationId}
                              onClick={() => setSelectedConsultationId(visit.consultationId)}
                              aria-label="View consultation"
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {visit.consultationId && (
                            <Tooltip title="Edit saved consultation">
                              <IconButton size="small" onClick={() => openEdit(visit)} aria-label="Edit consultation">
                                <Edit />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredVisits.length === 0 && (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No visits found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredVisits.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }}
            />
          </>
        )}
      </Paper>

      <Drawer
        anchor="right"
        open={Boolean(selectedConsultationId)}
        onClose={() => setSelectedConsultationId(null)}
        PaperProps={{ sx: { width: { xs: "100%", md: 500 }, p: 2 } }}
      >
        {selectedConsultationId && (
          <ConsultationDetails consultationId={selectedConsultationId} onClose={() => setSelectedConsultationId(null)} />
        )}
      </Drawer>

      <Drawer anchor="right" open={drawerOpen} onClose={closeForm} PaperProps={{ sx: { width: { xs: "100%", sm: 640 }, maxWidth: "100vw", p: 3, boxSizing: "border-box" } }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {visits.some((visit: any) => visit.id === form.visitId && visit.consultationId) ? "Edit Consultation" : "New Consultation"}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Saved through the consultation API for the selected patient visit.
          </Typography>
        </Box>
        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
        {visitsError && <Alert severity="error" sx={{ mb: 2 }}>Unable to load visits for consultation.</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2, overflowY: "auto", pb: 2 }}>
          <TextField
            fullWidth
            required
            select
            label="Patient visit"
            value={form.visitId}
            onChange={(event) => setForm((current) => ({ ...current, visitId: event.target.value }))}
            disabled={visitsLoading || Boolean(visits.some((visit: any) => visit.id === form.visitId && visit.consultationId))}
          >
            {[
              ...visitsForForm,
              ...visits.filter((visit: any) => visit.id === form.visitId && visit.consultationId)
                .map((visit: any) => ({ id: visit.id, patient: { firstName: visit.patientName, lastName: "" }, visitDate: visit.date, visitType: "", status: visit.status })),
            ].map((visit: any) => (
              <MenuItem key={visit.id} value={visit.id}>
                {visit.patient?.firstName} {visit.patient?.lastName} · {new Date(visit.visitDate).toLocaleDateString()} · {visit.status}
              </MenuItem>
            ))}
          </TextField>
          {visitsLoading && <CircularProgress size={22} />}
          {!visitsLoading && !visitsError && visitsForForm.length === 0 && (
            <Alert severity="info">There are no visits available without an existing consultation.</Alert>
          )}
          <TextField
            fullWidth
            select
            label="Assigned doctor"
            value={form.assignedDoctorId}
            onChange={(event) => setForm((current) => ({ ...current, assignedDoctorId: event.target.value }))}
            disabled={doctorsLoading}
          >
            {doctors.map((doctor: any) => (
              <MenuItem key={doctor.id} value={doctor.id}>Dr. {doctor.firstName} {doctor.lastName}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth required multiline minRows={2}
            label="Chief complaint"
            value={form.chiefComplaint}
            onChange={(event) => setForm((current) => ({ ...current, chiefComplaint: event.target.value }))}
          />
          <TextField
            fullWidth multiline minRows={3}
            label="History of present complaint"
            value={form.historyOfPC}
            onChange={(event) => setForm((current) => ({ ...current, historyOfPC: event.target.value }))}
          />
          <TextField
            fullWidth multiline minRows={3}
            label="Examination"
            value={form.examination}
            onChange={(event) => setForm((current) => ({ ...current, examination: event.target.value }))}
          />
          <TextField
            fullWidth multiline minRows={3}
            label="Clinical notes"
            value={form.clinicalNotes}
            onChange={(event) => setForm((current) => ({ ...current, clinicalNotes: event.target.value }))}
          />
          <TextField
            fullWidth multiline minRows={3}
            label="Plan"
            value={form.plan}
            onChange={(event) => setForm((current) => ({ ...current, plan: event.target.value }))}
          />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Diagnoses</Typography>
            {form.diagnoses.map((diagnosis, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth label="ICD-10 code" value={diagnosis.icd10Code}
                      onChange={(event) => updateDiagnosis(index, { icd10Code: event.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth required label="Diagnosis description" value={diagnosis.icd10Desc}
                      onChange={(event) => updateDiagnosis(index, { icd10Desc: event.target.value })}
                    />
                  </Grid>
                  <Grid item xs={9}>
                    <TextField
                      fullWidth select label="Diagnosis type" value={diagnosis.diagnosisType}
                      onChange={(event) => updateDiagnosis(index, { diagnosisType: event.target.value as DiagnosisType })}
                    >
                      {(["PRIMARY", "SECONDARY", "DIFFERENTIAL"] as DiagnosisType[]).map((type) => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={3} sx={{ textAlign: "right" }}>
                    <IconButton
                      color="error" aria-label="Remove diagnosis"
                      onClick={() => setForm((current) => ({ ...current, diagnoses: current.diagnoses.filter((_, itemIndex) => itemIndex !== index) }))}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Diagnosis notes" value={diagnosis.notes}
                      onChange={(event) => updateDiagnosis(index, { notes: event.target.value })}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button
              startIcon={<Add />}
              onClick={() => setForm((current) => ({
                ...current,
                diagnoses: [...current.diagnoses, {
                  icd10Code: "",
                  icd10Desc: "",
                  diagnosisType: current.diagnoses.length ? "SECONDARY" : "PRIMARY",
                  notes: "",
                }],
              }))}
            >
              Add diagnosis
            </Button>
          </Box>
          <TextField
            fullWidth type="date" label="Follow-up date" InputLabelProps={{ shrink: true }}
            value={form.followUpDate}
            onChange={(event) => setForm((current) => ({ ...current, followUpDate: event.target.value }))}
          />
          <TextField
            fullWidth select label="Follow-up status" value={form.followUpStatus}
            onChange={(event) => setForm((current) => ({ ...current, followUpStatus: event.target.value as FollowUpStatus }))}
          >
            {(["SCHEDULED", "COMPLETED", "MISSED"] as FollowUpStatus[]).map((status) => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth multiline minRows={2} label="Follow-up notes" value={form.followUpNotes}
            onChange={(event) => setForm((current) => ({ ...current, followUpNotes: event.target.value }))}
          />
          <TextField
            fullWidth select label="Completion" value={form.complete ? "COMPLETED" : "SAVE"}
            onChange={(event) => setForm((current) => ({ ...current, complete: event.target.value === "COMPLETED" }))}
            helperText="Completion advances the linked visit and appointment using the server workflow."
          >
            <MenuItem value="SAVE">Save without completing</MenuItem>
            <MenuItem value="COMPLETED">Complete consultation</MenuItem>
          </TextField>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, pt: 1 }}>
            <Button onClick={closeForm} disabled={createConsultationMutation.isPending}>Cancel</Button>
            <Button
              type="submit" variant="contained"
              disabled={createConsultationMutation.isPending || visitsLoading || !form.visitId}
            >
              {createConsultationMutation.isPending
                ? <CircularProgress size={22} color="inherit" />
                : form.visitId && visits.some((visit: any) => visit.id === form.visitId && visit.consultationId)
                  ? "Save changes"
                  : "Save consultation"}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default ConsultationsPage;
