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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Add, DeleteOutline, Visibility, Search } from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency } from "../../utils/currency";

interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientName: string;
  doctorName: string;
  date: string;
  status: string;
  medications: number;
  amount: number;
  createdAt: string;
  details: any;
}

const PrescriptionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userRole = typeof user?.role === "string" ? user.role : user?.role?.name;
  const isDoctor = userRole?.toUpperCase() === "DOCTOR";
  const canCreatePrescription = isDoctor || userRole?.toUpperCase() === "ADMINISTRATOR";

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
  

  // New prescription form state
  const steps = [
    "Patient & Doctor",
    "Medication Details",
    "Instructions",
    "Review & Submit",
  ];

  interface PrescriptionFormData {
    visitId: string;
    patientId: string;
    doctorId: string;
    medicationList: Array<{
      medicineId: string;
      dosage: string;
      frequency: string;
      duration: string;
      quantity: number;
    }>;
    notes: string;
  }

  const initialFormData: PrescriptionFormData = {
    visitId: "",
    patientId: "",
    doctorId: isDoctor ? user?.id || "" : "",
    medicationList: [],
    notes: "",
  };

  const [formData, setFormData] =
    useState<PrescriptionFormData>(initialFormData);
  const [medicineDraft, setMedicineDraft] = useState({
    medicineId: "",
    dosage: "",
    frequency: "",
    duration: "",
    quantity: 1,
  });

  const { data: medicineCatalog = [] } = useQuery({
    queryKey: ["prescription-medicines"],
    queryFn: async () => {
      const response = await api.get("/pharmacy/medicines", { params: { limit: 100 } });
      const now = Date.now();
      return (response.data?.data || []).map((medicine: any) => ({
        ...medicine,
        batches: (medicine.batches || [])
          .filter((batch: any) => Number(batch.quantityLeft) > 0 && new Date(batch.expiresAt).getTime() > now)
          .sort((first: any, second: any) =>
            new Date(first.expiresAt).getTime() - new Date(second.expiresAt).getTime() ||
            new Date(first.receivedAt).getTime() - new Date(second.receivedAt).getTime(),
          ),
      }));
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => name === "patientId"
      ? { ...prev, patientId: value, visitId: "" }
      : { ...prev, [name]: value });
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
    setMedicineDraft({ medicineId: "", dosage: "", frequency: "", duration: "", quantity: 1 });
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
      const res = await api.post("/prescriptions", {
        visitId: data.visitId,
        prescribedBy: data.doctorId,
        notes: data.notes,
        items: data.medicationList,
      });
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

  const handleAddMedication = () => {
    if (
      !medicineDraft.medicineId ||
      !medicineDraft.dosage.trim() ||
      !medicineDraft.frequency.trim() ||
      !medicineDraft.duration.trim() ||
      medicineDraft.quantity <= 0
    ) return;
    if (estimateMedicationAmount(medicineDraft.medicineId, medicineDraft.quantity) === null) return;

    setFormData((current) => ({
      ...current,
      medicationList: [...current.medicationList, { ...medicineDraft }],
    }));
    setMedicineDraft({ medicineId: "", dosage: "", frequency: "", duration: "", quantity: 1 });
  };

  const estimateMedicationAmount = (medicineId: string, quantity: number) => {
    const batches = medicineCatalog.find((medicine: any) => medicine.id === medicineId)?.batches || [];
    let remaining = quantity;
    let amount = 0;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const batchQuantity = Math.min(remaining, Number(batch.quantityLeft));
      amount += batchQuantity * Number(batch.sellingPrice);
      remaining -= batchQuantity;
    }
    return remaining > 0 ? null : amount;
  };

  const estimatedPrescriptionAmount = formData.medicationList.reduce(
    (total, item) => total + (estimateMedicationAmount(item.medicineId, item.quantity) || 0),
    0,
  );

  // Fetch prescriptions from API
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => {
      const res = await api.get("/prescriptions");
      const records = res.data?.data ?? res.data?.prescriptions ?? [];
      return records.map((prescription: any) => ({
        id: prescription.id,
        prescriptionNumber: `RX-${prescription.id.slice(0, 8).toUpperCase()}`,
        patientName:
          `${prescription.visit?.patient?.firstName || prescription.patient?.firstName || ""} ${prescription.visit?.patient?.lastName || prescription.patient?.lastName || ""}`.trim() ||
          "Unknown",
        doctorName: prescription.doctor
          ? `${prescription.doctor.firstName} ${prescription.doctor.lastName}`
          : "Unassigned",
        date: prescription.prescriptionDate || prescription.createdAt,
        status: prescription.status,
        medications: prescription.items?.length || prescription.medications?.length || 0,
        amount: Number(prescription.amount ?? 0),
        createdAt: prescription.createdAt,
        details: prescription,
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
      case 0: {
        const selectedPatient = patients?.find((patient: any) => patient.id === formData.patientId);
        const activeVisits = selectedPatient?.visits?.filter(
          (visit: any) => !["COMPLETED", "CANCELLED"].includes(visit.status),
        ) || [];
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Select Patient" name="patientId" value={formData.patientId} onChange={handleInputChange} required select>
                {patients?.map((patient: any) => <MenuItem key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Select Visit" name="visitId" value={formData.visitId} onChange={handleInputChange} required select disabled={!formData.patientId}>
                {activeVisits.map((visit: any) => <MenuItem key={visit.id} value={visit.id}>{new Date(visit.visitDate).toLocaleString()} · {visit.visitType}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Prescribing Doctor" name="doctorId" value={formData.doctorId} onChange={handleInputChange} required select disabled={isDoctor} helperText={isDoctor ? "Your account is selected as the prescribing doctor." : undefined}>
                {doctors?.map((doctor: any) => <MenuItem key={doctor.id} value={doctor.id}>{doctor.firstName} {doctor.lastName}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        );
      }

      case 1:
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Add Medication</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth select label="Medicine" value={medicineDraft.medicineId} onChange={(event) => setMedicineDraft((current) => ({ ...current, medicineId: event.target.value }))}>
                      {medicineCatalog.map((medicine: any) => {
                        const available = medicine.batches.reduce((total: number, batch: any) => total + Number(batch.quantityLeft), 0);
                        const firstBatch = medicine.batches[0];
                        return <MenuItem key={medicine.id} value={medicine.id} disabled={available <= 0}>{medicine.name} · In stock: {available}{firstBatch ? ` · ${formatCurrency(firstBatch.sellingPrice)}/unit` : ""}</MenuItem>;
                      })}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Dosage" value={medicineDraft.dosage} onChange={(event) => setMedicineDraft((current) => ({ ...current, dosage: event.target.value }))} placeholder="e.g., 1 tablet" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Frequency" value={medicineDraft.frequency} onChange={(event) => setMedicineDraft((current) => ({ ...current, frequency: event.target.value }))} placeholder="e.g., Twice daily" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Duration" value={medicineDraft.duration} onChange={(event) => setMedicineDraft((current) => ({ ...current, duration: event.target.value }))} placeholder="e.g., 7 days" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth type="number" label="Quantity" value={medicineDraft.quantity} inputProps={{ min: 1, step: 1 }} onChange={(event) => {
                      const value = Number(event.target.value);
                      setMedicineDraft((current) => ({ ...current, quantity: Number.isFinite(value) && value > 0 ? Math.floor(value) : 1 }));
                    }} />
                  </Grid>
                  <Grid item xs={12}>
                    {medicineDraft.medicineId && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{estimateMedicationAmount(medicineDraft.medicineId, medicineDraft.quantity) === null ? "Not enough stock for this quantity." : `Estimated amount: ${formatCurrency(estimateMedicationAmount(medicineDraft.medicineId, medicineDraft.quantity) ?? 0)}`}</Typography>}
                    <Button variant="outlined" startIcon={<Add />} onClick={handleAddMedication} disabled={!medicineDraft.medicineId || !medicineDraft.dosage.trim() || !medicineDraft.frequency.trim() || !medicineDraft.duration.trim() || estimateMedicationAmount(medicineDraft.medicineId, medicineDraft.quantity) === null}>Add Medication</Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            {formData.medicationList.map((item, index) => (
              <Grid item xs={12} key={`${item.medicineId}-${index}`}>
                <Paper variant="outlined" sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Box>
                    <Typography fontWeight={600}>{medicineCatalog.find((medicine: any) => medicine.id === item.medicineId)?.name || "Medicine"}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.dosage} · {item.frequency} · {item.duration} · Qty {item.quantity} · {formatCurrency(estimateMedicationAmount(item.medicineId, item.quantity) ?? 0)}</Typography>
                  </Box>
                  <IconButton aria-label="Remove medication" onClick={() => setFormData((current) => ({ ...current, medicationList: current.medicationList.filter((_, itemIndex) => itemIndex !== index) }))}><DeleteOutline /></IconButton>
                </Paper>
              </Grid>
            ))}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={4} label="Special Instructions" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Instructions for the pharmacist or patient" />
            </Grid>
          </Grid>
        );

      case 3: {
        const patient = patients?.find((item: any) => item.id === formData.patientId);
        const doctor = doctors?.find((item: any) => item.id === formData.doctorId);
        const visit = patient?.visits?.find((item: any) => item.id === formData.visitId);
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Prescription Summary</Typography>
                <Typography><strong>Patient:</strong> {patient ? `${patient.firstName} ${patient.lastName}` : "Not selected"}</Typography>
                <Typography><strong>Visit:</strong> {visit ? new Date(visit.visitDate).toLocaleString() : "Not selected"}</Typography>
                <Typography><strong>Prescribing doctor:</strong> {doctor ? `${doctor.firstName} ${doctor.lastName}` : "Not selected"}</Typography>
                <Typography><strong>Medications:</strong> {formData.medicationList.length}</Typography>
                <Typography><strong>Estimated amount:</strong> {formatCurrency(estimatedPrescriptionAmount)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={handleSubmit} disabled={addPrescriptionMutation.isPending || !formData.visitId || !formData.doctorId || !formData.medicationList.length} sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}>
                {addPrescriptionMutation.isPending ? <CircularProgress size={24} color="inherit" /> : "Create Prescription"}
              </Button>
            </Grid>
          </Grid>
        );
      }

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
          {canCreatePrescription && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenAdd}
            >
              New Prescription
            </Button>
          )}
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
                      <TableCell sx={{ fontWeight: "bold" }}>Amount (MWK)</TableCell>
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
                          <TableCell>{formatCurrency(prescription.amount)}</TableCell>
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
                                onClick={() => setSelectedPrescription(prescription)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    {filteredPrescriptions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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

        <Dialog open={!!selectedPrescription} onClose={() => setSelectedPrescription(null)} fullWidth maxWidth="sm">
          <DialogTitle>Prescription Details</DialogTitle>
          <DialogContent dividers>
            {selectedPrescription && (() => {
              const prescription = selectedPrescription.details;
              const invoiceItems = prescription.visit?.invoice?.items || [];
              return (
                <Box sx={{ display: "grid", gap: 1.5 }}>
                  <Typography><strong>Prescription:</strong> {selectedPrescription.prescriptionNumber}</Typography>
                  <Typography><strong>Patient:</strong> {selectedPrescription.patientName}</Typography>
                  <Typography><strong>Prescribing doctor:</strong> {selectedPrescription.doctorName}</Typography>
                  <Typography><strong>Date:</strong> {new Date(selectedPrescription.date).toLocaleString()}</Typography>
                  <Typography><strong>Status:</strong> {selectedPrescription.status}</Typography>
                  <Typography><strong>Notes:</strong> {prescription.notes || "None"}</Typography>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Prescribed items</Typography>
                  {(prescription.items || []).map((item: any) => {
                    const invoiceItem = invoiceItems.find((line: any) => line.reference === item.id);
                    return (
                      <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Typography fontWeight={600}>{item.medicine?.name || "Medication"}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.dosage} · {item.frequency} · {item.duration} · Qty {item.quantity}
                        </Typography>
                        <Typography variant="body2">{formatCurrency(invoiceItem?.subtotal ?? 0)}</Typography>
                      </Paper>
                    );
                  })}
                  <Typography fontWeight={600}>Total: {formatCurrency(selectedPrescription.amount)}</Typography>
                </Box>
              );
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedPrescription(null)}>Close</Button>
          </DialogActions>
        </Dialog>

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
          {activeStep === 1 && (
            <Box
              sx={{
                mt: 2,
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
              }}
            >
              <Button onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={handleNext} disabled={!formData.medicationList.length}>
                Next
              </Button>
            </Box>
          )}
          {activeStep === 2 && (
            <Box
              sx={{
                mt: 2,
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
              }}
            >
              <Button onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={handleNext} disabled={!formData.medicationList.length}>
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
                disabled={!formData.patientId || !formData.visitId || !formData.doctorId}
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
