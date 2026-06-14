import { useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Drawer,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Add as AddIcon, Visibility, Edit } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import api from "../../services/api";

/*interface MaternityRecord {
  id: string;
  patientId: string;
  gestationWeeks: number;
  visitDate: string;
  recordedBy: string;
  weightKg: number;
  bpSystolic: number;
  bpDiastolic: number;
  fetalHeartRate: number;
  fundusHeight: number;
  presentation: string | null;
  ultrasoundNotes: string | null;
  riskFactors: string[];
  notes: string;
  nextVisitDate: string;
  status?: string;
}*/

const MaternityDashboardPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [lmp, setLmp] = useState("");
  const [gravida, setGravida] = useState<number>(0);
  const [parity, setParity] = useState<number>(0);
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [bpSystolic, setBpSystolic] = useState<number | "">("");
  const [bpDiastolic, setBpDiastolic] = useState<number | "">("");
  // Details drawer state
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  // New visit form state
  const [newVisitFormOpen, setNewVisitFormOpen] = useState(false);
  const [newWeightKg, setNewWeightKg] = useState<number | "">("");
  const [newBpSystolic, setNewBpSystolic] = useState<number | "">("");
  const [newBpDiastolic, setNewBpDiastolic] = useState<number | "">("");
  const [newFetalHeartRate, setNewFetalHeartRate] = useState<number | "">("");
  const [newFundusHeight, setNewFundusHeight] = useState<number | "">("");
  const [newPresentation, setNewPresentation] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newNextVisitDate, setNewNextVisitDate] = useState("");

  // Fetch all patients for the form
  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const response = await api.get("/patients");
      return response.data.patients;
    },
  });

  // Fetch all ANC (maternity) records - handle paginated response
  const { data: maternityRecords = [], refetch } = useQuery({
    queryKey: ["maternity-records"],
    queryFn: async () => {
      const response = await api.get("/maternity/anc");
      // Backend returns { data: { records: [], pagination: {} } }
      const responseData = response.data.data;
      const records = responseData.records || [];
      // Guarantee we always return an array to prevent filter errors
      return Array.isArray(records) ? records : [];
    },
  });

  const calculateGestationWeeks = (lmpDate: string): number => {
    if (!lmpDate) return 0;
    const lmp = new Date(lmpDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lmp.getTime());
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    return diffWeeks;
  };

  const calculateEDD = (lmpDate: string): string => {
    if (!lmpDate) return "";
    const lmp = new Date(lmpDate);
    const edd = new Date(lmp.getTime() + 40 * 7 * 24 * 60 * 60 * 1000);
    return edd.toISOString().split('T')[0];
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setActiveStep(0);
  };

  const handleViewDetails = (record: any) => {
    setSelectedRecord(record);
    setDetailsDrawerOpen(true);
  };

  const handleCloseDetailsDrawer = () => {
    setDetailsDrawerOpen(false);
    setSelectedRecord(null);
    setNewVisitFormOpen(false);
    // Reset new visit form
    setNewWeightKg("");
    setNewBpSystolic("");
    setNewBpDiastolic("");
    setNewFetalHeartRate("");
    setNewFundusHeight("");
    setNewPresentation("");
    setNewNotes("");
    setNewNextVisitDate("");
  };

  const handleEditRecord = () => {
    Swal.fire("Info", "Edit functionality coming soon", "info");
  };

  // Add new visit/consultation
  const addNewVisit = async () => {
    if (!selectedRecord) return;
    
    try {
      // Calculate new gestation weeks
      const today = new Date();
      const lastVisit = new Date(selectedRecord.visitDate);
      const diffWeeks = Math.floor((today.getTime() - lastVisit.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const newGestationWeeks = selectedRecord.gestationWeeks + (diffWeeks || 2); // Default to 2 weeks if same day
      
      // Submit new visit record
      await api.put(`/maternity/anc/${selectedRecord.id}`, {
        weightKg: newWeightKg !== "" ? newWeightKg : selectedRecord.weightKg,
        bpSystolic: newBpSystolic !== "" ? newBpSystolic : selectedRecord.bpSystolic,
        bpDiastolic: newBpDiastolic !== "" ? newBpDiastolic : selectedRecord.bpDiastolic,
        fetalHeartRate: newFetalHeartRate !== "" ? newFetalHeartRate : selectedRecord.fetalHeartRate,
        fundusHeight: newFundusHeight !== "" ? newFundusHeight : selectedRecord.fundusHeight,
        presentation: newPresentation || selectedRecord.presentation,
        notes: newNotes || selectedRecord.notes,
        nextVisitDate: newNextVisitDate ? new Date(newNextVisitDate).toISOString() : selectedRecord.nextVisitDate,
        gestationWeeks: newGestationWeeks,
        visitDate: new Date().toISOString()
      });
      
      // Reset form
      setNewWeightKg("");
      setNewBpSystolic("");
      setNewBpDiastolic("");
      setNewFetalHeartRate("");
      setNewFundusHeight("");
      setNewPresentation("");
      setNewNotes("");
      setNewNextVisitDate("");
      setNewVisitFormOpen(false);
      
      Swal.fire("Success", "New visit/consultation recorded successfully", "success");
      refetch();
    } catch (error) {
      console.error("Error adding new visit:", error);
      Swal.fire("Error", "Failed to record new visit", "error");
    }
  };

  const markAsDelivered = async () => {
    if (!selectedRecord) return;
    
    try {
      // Update record status to DELIVERED
      await api.put(`/maternity/anc/${selectedRecord.id}/deliver`, {});
      Swal.fire("Success", "Pregnancy marked as delivered", "success");
      handleCloseDetailsDrawer();
      refetch();
    } catch (error) {
      console.error("Error updating record:", error);
      Swal.fire("Error", "Failed to update record", "error");
    }
  };

  const handleOpenAdd = () => {
    setDrawerOpen(true);
  };

  const steps = ["Select Patient", "Pregnancy Details", "Review & Submit"];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Maternity Dashboard</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          New Pregnancy Record
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Gestation Weeks</TableCell>
              <TableCell>Last Visit</TableCell>
              <TableCell>Next Visit</TableCell>
              <TableCell>Weight (kg)</TableCell>
              <TableCell>BP</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(maternityRecords || []).map((record: any) => {
              // Find the patient for this record to get their full name
              const patient = patients?.find((p: any) => p.id === record.patientId);
              const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
              
              return (
                <TableRow key={record.id}>
                  <TableCell>{patientName}</TableCell>
                  <TableCell>{record.gestationWeeks || 'N/A'}</TableCell>
                  <TableCell>{record.visitDate ? new Date(record.visitDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{record.nextVisitDate ? new Date(record.nextVisitDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{record.weightKg || 'N/A'}</TableCell>
                  <TableCell>{record.bpSystolic && record.bpDiastolic ? `${record.bpSystolic}/${record.bpDiastolic}` : 'N/A'}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleViewDetails(record)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEditRecord()}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer anchor="right" open={drawerOpen} onClose={handleCloseDrawer}>
        <Box sx={{ width: 500, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            New Pregnancy Record
          </Typography>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Select Patient</InputLabel>
                  <Select
                    label="Select Patient"
                    value={selectedPatient}
                    onChange={(e) =>
                      setSelectedPatient(e.target.value as string)
                    }
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {patients?.map((patient: any) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} -{" "}
                        {patient.patientNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Last Menstrual Period"
                  type="date"
                  value={lmp}
                  onChange={(e) => setLmp(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              {lmp && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    disabled
                    label="Calculated Gestation Weeks"
                    value={calculateGestationWeeks(lmp)}
                    helperText="Gestation is automatically calculated from LMP"
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Gravida (Number of pregnancies)"
                  type="number"
                  value={gravida}
                  onChange={(e) => setGravida(parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Parity (Number of live births)"
                  type="number"
                  value={parity}
                  onChange={(e) => setParity(parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  type="number"
                  value={weightKg}
                  onChange={(e) =>
                    setWeightKg(parseFloat(e.target.value) || "")
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Blood Pressure (Systolic)"
                  type="number"
                  value={bpSystolic}
                  onChange={(e) =>
                    setBpSystolic(parseInt(e.target.value) || "")
                  }
                  placeholder="120"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Blood Pressure (Diastolic)"
                  type="number"
                  value={bpDiastolic}
                  onChange={(e) =>
                    setBpDiastolic(parseInt(e.target.value) || "")
                  }
                  placeholder="80"
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Selected Patient"
                  value={patients?.find((p: any) => p.id === selectedPatient)?.firstName + " " + patients?.find((p: any) => p.id === selectedPatient)?.lastName || "None"}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Gestation Weeks"
                  value={lmp ? calculateGestationWeeks(lmp) : 0}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Gravida"
                  value={gravida}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Parity"
                  value={parity}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Weight (kg)"
                  value={weightKg || "Not provided"}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Blood Pressure"
                  value={bpSystolic && bpDiastolic ? `${bpSystolic}/${bpDiastolic}` : "Not provided"}
                />
              </Grid>
            </Grid>
          )}

          <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
            <Button
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => prev - 1)}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={async () => {
                if (activeStep === steps.length - 1) {
                  try {
                    if (!selectedPatient) {
                      Swal.fire("Warning", "Please select a patient", "warning");
                      return;
                    }
                    if (!lmp) {
                      Swal.fire("Warning", "Please enter last menstrual period", "warning");
                      return;
                    }

                    const gestationWeeks = calculateGestationWeeks(lmp);
                    if (gestationWeeks < 4 || gestationWeeks > 45) {
                      Swal.fire("Warning", "Invalid gestation period. Must be between 4 and 45 weeks", "warning");
                      return;
                    }

                    // Calculate next visit date (2 weeks from today)
                    const nextVisit = new Date();
                    nextVisit.setDate(nextVisit.getDate() + 14);

                    // Submit the ANC record with all required fields
                    await api.post("/maternity/anc", {
                      patientId: selectedPatient,
                      gestationWeeks,
                      gravida,
                      parity,
                      weightKg: weightKg !== "" ? weightKg : undefined,
                      bpSystolic: bpSystolic !== "" ? bpSystolic : undefined,
                      bpDiastolic: bpDiastolic !== "" ? bpDiastolic : undefined,
                      visitDate: new Date().toISOString(),
                      edd: calculateEDD(lmp),
                      status: "ACTIVE",
                      nextVisitDate: nextVisit.toISOString()
                    });
                    handleCloseDrawer();
                    // Reset form
                    setSelectedPatient("");
                    setLmp("");
                    setGravida(0);
                    setParity(0);
                    setWeightKg("");
                    setBpSystolic("");
                    setBpDiastolic("");
                    setActiveStep(0);
                    // Refetch records
                    refetch();
                    Swal.fire("Success", "Pregnancy record created", "success");
                  } catch (error) {
                    console.error("Error creating record:", error);
                    Swal.fire("Error", "Failed to create pregnancy record", "error");
                  }
                } else {
                  if (activeStep === 0 && !selectedPatient) {
                    Swal.fire("Warning", "Please select a patient first", "warning");
                    return;
                  }
                  if (activeStep === 1 && !lmp) {
                    Swal.fire("Warning", "Please enter last menstrual period first", "warning");
                    return;
                  }
                  if (activeStep === 1 && lmp) {
                    const calculatedWeeks = calculateGestationWeeks(lmp);
                    if (calculatedWeeks < 4 || calculatedWeeks > 45) {
                      Swal.fire("Warning", "Invalid gestation period. Must be between 4 and 45 weeks", "warning");
                      return;
                    }
                  }
                  setActiveStep((prev) => prev + 1);
                }
              }}
            >
              {activeStep === steps.length - 1 ? "Submit" : "Next"}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Details Drawer */}
      <Drawer anchor="right" open={detailsDrawerOpen} onClose={handleCloseDetailsDrawer}>
        <Box sx={{ width: 550, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Patient Record & Consultations
          </Typography>
          
          {selectedRecord && (
            <>
              {/* Patient Summary Card */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0f7ff' }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Patient Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Patient ID</Typography>
                    <Typography>{selectedRecord.patientId}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Current Gestation</Typography>
                    <Typography><strong>{selectedRecord.gestationWeeks} weeks</strong></Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Last Visit</Typography>
                    <Typography>{new Date(selectedRecord.visitDate).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Next Visit</Typography>
                    <Typography>{new Date(selectedRecord.nextVisitDate).toLocaleDateString()}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {!newVisitFormOpen && (
                <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => setNewVisitFormOpen(true)}
                    startIcon={<AddIcon />}
                  >
                    Add New Visit
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="success"
                    onClick={markAsDelivered}
                  >
                    Mark as Delivered
                  </Button>
                </Box>
              )}

              {newVisitFormOpen && (
                <Paper sx={{ p: 2, mb: 3, border: '1px solid #1976d2' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Add New Visit
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Weight (kg)"
                        type="number"
                        value={newWeightKg}
                        onChange={(e) => setNewWeightKg(parseFloat(e.target.value) || "")}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="BP Systolic"
                        type="number"
                        value={newBpSystolic}
                        onChange={(e) => setNewBpSystolic(parseInt(e.target.value) || "")}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="BP Diastolic"
                        type="number"
                        value={newBpDiastolic}
                        onChange={(e) => setNewBpDiastolic(parseInt(e.target.value) || "")}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Fetal Heart Rate"
                        type="number"
                        value={newFetalHeartRate}
                        onChange={(e) => setNewFetalHeartRate(parseInt(e.target.value) || "")}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Fundus Height"
                        type="number"
                        value={newFundusHeight}
                        onChange={(e) => setNewFundusHeight(parseFloat(e.target.value) || "")}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Presentation</InputLabel>
                        <Select
                          value={newPresentation}
                          label="Presentation"
                          onChange={(e) => setNewPresentation(e.target.value as string)}
                        >
                          <MenuItem value="">None</MenuItem>
                          <MenuItem value="cephalic">Cephalic</MenuItem>
                          <MenuItem value="breech">Breech</MenuItem>
                          <MenuItem value="transverse">Transverse</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Next Visit Date"
                        type="date"
                        value={newNextVisitDate}
                        onChange={(e) => setNewNextVisitDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={3}
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button onClick={() => setNewVisitFormOpen(false)}>Cancel</Button>
                      <Button variant="contained" onClick={addNewVisit}>Save Visit</Button>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Previous visits history */}
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Visit History
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Weight</TableCell>
                      <TableCell>BP</TableCell>
                      <TableCell>FHR</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow key={selectedRecord.id}>
                      <TableCell>{new Date(selectedRecord.visitDate).toLocaleDateString()}</TableCell>
                      <TableCell>{selectedRecord.weightKg}</TableCell>
                      <TableCell>{selectedRecord.bpSystolic}/{selectedRecord.bpDiastolic}</TableCell>
                      <TableCell>{selectedRecord.fetalHeartRate}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default MaternityDashboardPage;