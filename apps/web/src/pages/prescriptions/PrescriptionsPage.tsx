import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientName: string;
  doctorName: string;
  date: string;
  status: string;
  medications: number;
  createdAt: string;
}

const PrescriptionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // New prescription form state
  const steps = [
    "Patient & Doctor",
    "Medication Details",
    "Instructions",
    "Review & Submit",
  ];

  const statusOptions = [
    "PENDING",
    "DISPENSED",
    "PARTIAL",
    "EXPIRED",
    "CANCELLED",
  ];

  interface PrescriptionFormData {
    patientId: string;
    doctorId: string;
    medicationList: any[];
    notes: string;
    status: string;
    expirationDate: string;
  }

  const initialFormData: PrescriptionFormData = {
    patientId: "",
    doctorId: "",
    medicationList: [],
    notes: "",
    status: "PENDING",
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  };

  const [formData, setFormData] =
    useState<PrescriptionFormData>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  // Mutation for adding new prescription
  const addPrescriptionMutation = useMutation({
    mutationFn: async (data: PrescriptionFormData) => {
      const res = await api.post("/prescriptions", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      handleCloseDrawer();
    },
  });

  const handleSubmit = () => {
    addPrescriptionMutation.mutate(formData);
  };

  // Fetch prescriptions from API
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => {
      const res = await api.get("/prescriptions");
      return res.data.prescriptions.map((prescription: any) => ({
        id: prescription.id,
        prescriptionNumber: `RX-${prescription.id.slice(0, 8).toUpperCase()}`,
        patientName:
          `${prescription.patient?.firstName || ""} ${prescription.patient?.lastName || ""}`.trim() ||
          "Unknown",
        doctorName: prescription.doctor
          ? `${prescription.doctor.firstName} ${prescription.doctor.lastName}`
          : "Unassigned",
        date: prescription.prescriptionDate,
        status: prescription.status,
        medications: prescription.medications?.length || 0,
        createdAt: prescription.createdAt,
      })) as Prescription[];
    },
  });

  // Filter prescriptions based on search term
  const filteredPrescriptions =
    prescriptions?.filter(
      (prescription) =>
        prescription.patientName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        prescription.doctorName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        prescription.prescriptionNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        prescription.status.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DISPENSED":
        return "success";
      case "PENDING":
        return "warning";
      case "PARTIAL":
        return "info";
      case "EXPIRED":
        return "error";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  // Render form steps
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Patient & Doctor
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
                <MenuItem value="patient-1">John Doe</MenuItem>
                <MenuItem value="patient-2">Jane Smith</MenuItem>
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
                <MenuItem value="doctor-1">Dr. James Wilson</MenuItem>
                <MenuItem value="doctor-2">Dr. Sarah Johnson</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expiration Date"
                name="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        );

      case 1: // Medication Details
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Add Medications
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Medication Name"
                      name="medicationName"
                      placeholder="e.g., Paracetamol 500mg"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Dosage"
                      name="dosage"
                      placeholder="e.g., 1 tablet"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Frequency"
                      name="frequency"
                      placeholder="e.g., Twice daily"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Duration"
                      name="duration"
                      placeholder="e.g., 7 days"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="outlined" startIcon={<Add />}>
                      Add Medication
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        );

      case 2: // Instructions
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Special Instructions"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Enter any special instructions for the pharmacist or patient"
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
                    {status}
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
                  Prescription Summary
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
                      <strong>Medications:</strong>{" "}
                      {formData.medicationList.length} items
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Status:</strong> {formData.status}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Expires:</strong>{" "}
                      {new Date(formData.expirationDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={addPrescriptionMutation.isPending}
                sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
              >
                {addPrescriptionMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Create Prescription"
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
              Prescriptions
            </Typography>
            <Typography color="text.secondary">
              Manage patient prescriptions and medication orders
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAdd}
          >
            New Prescription
          </Button>
        </Box>

        {/* Search Bar */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search prescriptions by patient, doctor, ID, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <Search sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
          />
        </Paper>

        {/* Prescriptions Table */}
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
                        Prescription ID
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Patient</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Doctor</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Medications
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPrescriptions
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage,
                      )
                      .map((prescription) => (
                        <TableRow key={prescription.id} hover>
                          <TableCell sx={{ fontFamily: "monospace" }}>
                            {prescription.prescriptionNumber}
                          </TableCell>
                          <TableCell>{prescription.patientName}</TableCell>
                          <TableCell>{prescription.doctorName}</TableCell>
                          <TableCell>
                            {new Date(prescription.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{prescription.medications}</TableCell>
                          <TableCell>
                            <Chip
                              label={prescription.status}
                              color={getStatusColor(prescription.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  navigate(`/prescriptions/${prescription.id}`)
                                }
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small">
                                <Edit />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    {filteredPrescriptions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No prescriptions found matching your search
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
                count={filteredPrescriptions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>

        {/* Add Prescription Drawer */}
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
              Add New Prescription
            </Typography>
            <Typography color="text.secondary">
              Create a new prescription for a patient
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
      </Box>
  );
};

export default PrescriptionsPage;
