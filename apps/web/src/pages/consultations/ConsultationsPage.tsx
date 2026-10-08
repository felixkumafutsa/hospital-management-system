import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Drawer,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
} from "@mui/material";
import { Add, Edit, Visibility, Search } from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import ConsultationDetails from '../../components/ConsultationDetails';
import { formatCurrency } from "../../utils/currency";

interface Consultation {
  id: string;
  consultationId?: string;
  consultationNumber: string;
  patientName: string;
  doctorName: string;
  date: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  symptoms: string;
  diagnosis: string;
  fee: number | null;
  createdAt: string;
}

const ConsultationsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const queryClient = useQueryClient();
  const { data: pricingSettings } = useQuery({
    queryKey: ["system-pricing"],
    queryFn: async () => (await api.get("/settings/pricing")).data.settings,
  });
  const configuredConsultationFee = Number(pricingSettings?.consultationFee || 0);

  // New consultation form state
  const steps = [
    "Patient & Doctor Assignment",
    "Clinical Details",
    "Billing & Status",
    "Review & Submit",
  ];

  const statusOptions = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

  interface ConsultationFormData {
    patientId: string;
    doctorId: string;
    consultationDate: string;
    symptoms: string;
    diagnosis: string;
    notes: string;
    fee: number;
    status: string;
  }

  const initialFormData: ConsultationFormData = {
    patientId: "",
    doctorId: "",
    consultationDate: new Date().toISOString().split("T")[0],
    symptoms: "",
    diagnosis: "",
    notes: "",
    fee: 0,
    status: "PENDING",
  };

  const [formData, setFormData] =
    useState<ConsultationFormData>(initialFormData);

  useEffect(() => {
    setFormData((current) => ({ ...current, fee: configuredConsultationFee }));
  }, [configuredConsultationFee]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'fee' ? Number(value) : value,
    }));
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setActiveStep(0);
    setFormData(initialFormData);
  };

  const handleOpenAdd = () => {
    setDrawerOpen(true);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Mutation for adding new consultation
  const addConsultationMutation = useMutation({
    mutationFn: async (data: ConsultationFormData) => {
      const res = await api.post("/visits", {
        ...data,
        visitType: "OUTPATIENT",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      handleCloseDrawer();
    },
  });

  const handleSubmit = () => {
    addConsultationMutation.mutate(formData);
  };

  // Fetch all patients from the system
  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const response = await api.get("/patients");
      return response.data.patients;
    },
  });

  // Fetch all users and filter to only doctors (uses the /users endpoint which returns all system users)
  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      // The /users endpoint returns all system users from the database
      const response = await api.get("/users");
      // Filter to only include users who are doctors (role.name === "DOCTOR")
      const allStaff = response.data.data || [];
      return allStaff.filter((staff: any) => staff.role?.name === "DOCTOR");
    },
  });

  // Fetch consultations from API
  const { data: consultations, isLoading } = useQuery({
    queryKey: ["consultations"],
    queryFn: async () => {
      const res = await api.get("/visits");
      return res.data.visits.filter((visit: any) => visit.consultation).map((visit: any) => ({
        id: visit.id,
        consultationId: visit.consultation?.id,
        consultationNumber: `CON-${visit.id.slice(0, 8).toUpperCase()}`,
        patientName:
          `${visit.patient?.firstName || ""} ${visit.patient?.lastName || ""}`.trim() ||
          "Unknown",
        doctorName: visit.consultation?.doctor
          ? `${visit.consultation.doctor.firstName} ${visit.consultation.doctor.lastName}`
          : "Unassigned",
        date: visit.visitDate,
        status: visit.status,
        symptoms: visit.consultation?.chiefComplaint || "N/A",
        diagnosis: visit.consultation?.diagnoses?.map((item: any) => item.icd10Desc).join(", ") || "N/A",
        fee: visit.consultation?.consultationFee == null
          ? null
          : Number(visit.consultation.consultationFee),
        createdAt: visit.createdAt,
      })) as Consultation[];
    },
  });

  // Filter consultations based on search term
  const filteredConsultations =
    consultations?.filter(
      (consultation) =>
        consultation.patientName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        consultation.doctorName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        consultation.consultationNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        consultation.status.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "IN_PROGRESS":
        return "primary";
      case "PENDING":
        return "warning";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  // Render form steps
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Patient & Doctor Assignment
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Select Patient"
                name="patientId"
                value={formData.patientId}
                onChange={handleInputChange}
                required
                select
              >
                {patients?.map((patient: any) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} -{" "}
                    {patient.patientNumber}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Select Doctor"
                name="doctorId"
                value={formData.doctorId}
                onChange={handleInputChange}
                required
                select
              >
                {doctors?.map((doctor: any) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Consultation Date"
                name="consultationDate"
                type="date"
                value={formData.consultationDate}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        );

      case 1: // Clinical Details
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Symptoms"
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Additional Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        );

      case 2: // Billing & Status
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Consultation Fee"
                value={configuredConsultationFee > 0 ? formatCurrency(configuredConsultationFee) : "Not configured"}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replace("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        );

      case 3: // Review & Submit
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Consultation Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Patient ID:</strong>{" "}
                      {formData.patientId || "Not selected"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Doctor ID:</strong>{" "}
                      {formData.doctorId || "Not selected"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Date:</strong>{" "}
                      {formData.consultationDate
                        ? new Date(
                            formData.consultationDate,
                          ).toLocaleDateString()
                        : "Not set"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Status:</strong> {formData.status}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Fee:</strong> {formatCurrency(configuredConsultationFee)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Symptoms:</strong>{" "}
                      {formData.symptoms || "None recorded"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Diagnosis:</strong>{" "}
                      {formData.diagnosis || "None recorded"}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={addConsultationMutation.isPending}
                sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
              >
                {addConsultationMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Create Consultation"
                )}
              </Button>
            </Box>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        width: "100%",
        boxSizing: "border-box",
      }}
    >

      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
            Consultations
          </Typography>
          <Typography color="text.secondary">
            Manage patient consultations and medical records
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
          New Consultation
        </Button>
      </Box>

      {/* Search Bar */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search consultations by patient, doctor, ID, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
        />
      </Paper>

      {/* Consultations Table */}
      <Paper elevation={2} sx={{ width: "100%", overflow: "hidden" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Consultation ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Doctor</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Symptoms</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Fee</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredConsultations
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((consultation) => (
                      <TableRow key={consultation.id} hover>
                        <TableCell sx={{ fontFamily: "monospace" }}>
                          {consultation.consultationNumber}
                        </TableCell>
                        <TableCell>{consultation.patientName}</TableCell>
                        <TableCell>{consultation.doctorName}</TableCell>
                        <TableCell>
                          {new Date(consultation.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {consultation.symptoms.length > 30
                            ? `${consultation.symptoms.substring(0, 30)}...`
                            : consultation.symptoms}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={consultation.status}
                            color={getStatusColor(consultation.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{consultation.fee == null ? "Not recorded" : formatCurrency(consultation.fee)}</TableCell>
                        <TableCell>
                          <Tooltip title={consultation.consultationId ? "View Details" : "No consultation created for this visit"}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={!consultation.consultationId}
                                onClick={() => {
                                  if (consultation.consultationId) {
                                    setSelectedConsultationId(consultation.consultationId);
                                  }
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredConsultations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No consultations found matching your search
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredConsultations.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Consultation Details Drawer */}
      <Drawer
        anchor="right"
        open={!!selectedConsultationId}
        onClose={() => setSelectedConsultationId(null)}
        PaperProps={{
          sx: { width: { xs: "100%", md: "500px" }, p: 2 },
        }}
      >
        {selectedConsultationId && (
          <ConsultationDetails
            consultationId={selectedConsultationId}
            onClose={() => setSelectedConsultationId(null)}
          />
        )}
      </Drawer>

      {/* Add Consultation Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { width: { xs: "100%", md: "600px" }, p: 4 },
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
            Add New Consultation
          </Typography>
          <Typography color="text.secondary">
            Fill in the information to create a new patient consultation
          </Typography>
        </Box>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent()}
        {activeStep > 0 && activeStep < steps.length - 1 && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              gap: 2,
              justifyContent: "flex-end",
            }}
          >
            <Button onClick={handleBack}>Back</Button>
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          </Box>
        )}
        {activeStep === steps.length - 2 && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              gap: 2,
              justifyContent: "flex-end",
            }}
          >
            <Button onClick={handleBack}>Back</Button>
            <Button variant="contained" onClick={handleNext}>
              Review
            </Button>
          </Box>
        )}
        {activeStep === 0 && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              gap: 2,
              justifyContent: "flex-end",
            }}
          >
            <Button onClick={handleCloseDrawer}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!formData.patientId || !formData.doctorId}
            >
              Next
            </Button>
          </Box>
        )}
      </Drawer>

      {/* Consultation Details Drawer */}
      <Drawer
        anchor="right"
        open={!!selectedConsultationId}
        onClose={() => setSelectedConsultationId(null)}
        PaperProps={{
          sx: { width: { xs: "100%", md: "500px" }, p: 2 },
        }}
      >
        {selectedConsultationId && (
          <ConsultationDetails
            consultationId={selectedConsultationId}
            onClose={() => setSelectedConsultationId(null)}
          />
        )}
      </Drawer>
    </Box>
  );
};

export default ConsultationsPage;