import { useState, useMemo } from "react";
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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Add as AddIcon, Visibility, Edit, Notes } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
  const [gravida, setGravida] = useState<number>(1);
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
  const [activeTab, setActiveTab] = useState(0);
  const [deliveryMethod, setDeliveryMethod] = useState("VAGINAL");
  const [theaterRequestOpen, setTheaterRequestOpen] = useState(false);
  const [selectedProcedureId, setSelectedProcedureId] = useState("");
  const [plannedProcedureDate, setPlannedProcedureDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
  });
  const [theaterRequestNotes, setTheaterRequestNotes] = useState("");

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
      if (!Array.isArray(records)) return [];
      const latestRecordByProfile = new Map<string, any>();
      for (const record of records) {
        if (record.maternityProfile?.status === "ACTIVE" && !latestRecordByProfile.has(record.maternityProfileId)) {
          latestRecordByProfile.set(record.maternityProfileId, record);
        }
      }
      return Array.from(latestRecordByProfile.values());
    },
  });

  const { data: deliveries = [], refetch: refetchDeliveries } = useQuery({
    queryKey: ["deliveries"],
    queryFn: async () => {
      const response = await api.get("/maternity/deliveries");
      const responseData = response.data.data;
      // Ensure the returned value is always an array
      return Array.isArray(responseData) ? responseData : [];
    },
  });

  const { data: postnatalRecords = [] } = useQuery({
    queryKey: ["maternity-postnatal"],
    queryFn: async () => {
      const response = await api.get("/maternity/postnatal");
      const records = response.data.data?.records || [];
      return Array.isArray(records) ? records : [];
    },
  });

  const { data: procedureCatalog = [] } = useQuery({
    queryKey: ["theater-procedure-catalog"],
    queryFn: async () => {
      const response = await api.get("/theater/catalog");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const selectedProfileId = selectedRecord?.maternityProfileId;
  const selectedPatientId = selectedRecord?.maternityProfile?.patientId;
  const { data: selectedAncHistory = [] } = useQuery({
    queryKey: ["maternity-anc-history", selectedProfileId],
    queryFn: async () => {
      if (!selectedProfileId || !selectedPatientId) {
        throw new Error("A selected pregnancy profile is required to load its visit history");
      }
      const response = await api.get(
        `/maternity/anc/patient/${selectedPatientId}`,
      );
      if (!Array.isArray(response.data.data)) {
        throw new Error("The ANC visit history response was invalid");
      }
      return response.data.data.filter(
        (record: any) => record.maternityProfileId === selectedProfileId,
      );
    },
    enabled: detailsDrawerOpen && Boolean(selectedProfileId && selectedPatientId),
  });

  const deliveryDataForChart = useMemo(() => {
    const monthlyDeliveries: { [key: string]: number } = {};
    deliveries.forEach((delivery: any) => {
      const month = new Date(delivery.deliveryDate).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (monthlyDeliveries[month]) {
        monthlyDeliveries[month]++;
      } else {
        monthlyDeliveries[month] = 1;
      }
    });

    return Object.keys(monthlyDeliveries).map((month) => ({
      month,
      deliveries: monthlyDeliveries[month],
    }));
  }, [deliveries]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

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
      const lmpDate = selectedRecord.maternityProfile?.lastMenstrualPeriod
        ? new Date(selectedRecord.maternityProfile.lastMenstrualPeriod)
        : null;
      const weeksSinceLastVisit = Math.floor(
        (Date.now() - new Date(selectedRecord.visitDate).getTime()) / (7 * 24 * 60 * 60 * 1000),
      );
      const gestationWeeks = lmpDate
        ? Math.floor((Date.now() - lmpDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        : selectedRecord.gestationWeeks + weeksSinceLastVisit;
      await api.post("/maternity/anc", {
        patientId: selectedRecord.maternityProfile.patientId,
        gestationWeeks,
        weightKg: newWeightKg !== "" ? newWeightKg : undefined,
        bpSystolic: newBpSystolic !== "" ? newBpSystolic : undefined,
        bpDiastolic: newBpDiastolic !== "" ? newBpDiastolic : undefined,
        fetalHeartRate: newFetalHeartRate !== "" ? newFetalHeartRate : undefined,
        fundusHeight: newFundusHeight !== "" ? newFundusHeight : undefined,
        presentation: newPresentation || undefined,
        notes: newNotes || undefined,
        nextVisitDate: newNextVisitDate
          ? new Date(newNextVisitDate).toISOString()
          : undefined,
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

      Swal.fire("Success", "New antenatal visit recorded successfully", "success");
      refetch();
    } catch (error) {
      console.error("Error adding new visit:", error);
      Swal.fire("Error", "Failed to record new visit", "error");
    }
  };

  const markAsDelivered = async () => {
    if (!selectedRecord) return;

    try {
      // Update record status to DELIVERED - use correct POST endpoint with valid enum value
      await api.post(`/maternity/anc/${selectedRecord.id}/deliver`, {
        patientId: selectedRecord.maternityProfile.patient.id,
        deliveryDate: new Date().toISOString(),
        deliveryMethod
      });
      Swal.fire("Success", "Pregnancy marked as delivered", "success");
      handleCloseDetailsDrawer();
      refetch();
      refetchDeliveries();
    } catch (error) {
      console.error("Error updating record:", error);
      Swal.fire("Error", "Failed to update record", "error");
    }
  };

  const requestCesareanTheaterCase = async () => {
    if (!selectedRecord?.maternityProfileId || !selectedProcedureId || !plannedProcedureDate) {
      Swal.fire("Warning", "Select a procedure and planned date before submitting", "warning");
      return;
    }
    try {
      await api.post("/theater/requests/maternity", {
        maternityProfileId: selectedRecord.maternityProfileId,
        catalogId: selectedProcedureId,
        procedureDate: new Date(plannedProcedureDate).toISOString(),
        notes: theaterRequestNotes || undefined,
      });
      setTheaterRequestOpen(false);
      setDeliveryMethod("CAESAREAN");
      setTheaterRequestNotes("");
      Swal.fire("Success", "Theater request sent for review and scheduling", "success");
    } catch (error) {
      console.error("Unable to create maternity theater request:", error);
      Swal.fire("Error", "Unable to create the theater request", "error");
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


      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Deliveries Over Time
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={deliveryDataForChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="deliveries"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      <Paper>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Pregnant Patients" />
          <Tab label="Deliveries" />
          <Tab label="Postnatal" />
        </Tabs>
        {activeTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Gestation Weeks</TableCell>
                  <TableCell>Last Visit</TableCell>
                  <TableCell>Next Visit</TableCell>
                  <TableCell>Weight (kg)</TableCell>
                  <TableCell>BP</TableCell>
                  <TableCell>Visit Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(maternityRecords || []).map((record: any) => {
                  const patient = record.maternityProfile?.patient;
                  const patientName = patient
                    ? `${patient.firstName} ${patient.lastName}`
                    : "Unknown Patient";

                  return (
                    <TableRow key={record.id}>
                      <TableCell>{patientName}</TableCell>
                      <TableCell>{record.gestationWeeks || "N/A"}</TableCell>
                      <TableCell>
                        {record.visitDate
                          ? new Date(record.visitDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {record.nextVisitDate
                          ? new Date(record.nextVisitDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>{record.weightKg || "N/A"}</TableCell>
                      <TableCell>
                        {record.bpSystolic && record.bpDiastolic
                          ? `${record.bpSystolic}/${record.bpDiastolic}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={record.notes || record.ultrasoundNotes || "No visit notes recorded"} arrow>
                          <IconButton size="small" aria-label="View antenatal visit notes">
                            <Notes fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(record)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRecord()}
                          >
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
        )}
        {activeTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Delivery Date</TableCell>
                  <TableCell>Delivery Method</TableCell>
                  <TableCell>Outcome</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(deliveries || []).map((delivery: any) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      {delivery.maternityProfile?.patient
                        ? `${delivery.maternityProfile.patient.firstName} ${delivery.maternityProfile.patient.lastName}`
                        : "Unknown Patient"}
                    </TableCell>
                    <TableCell>
                      {new Date(delivery.deliveryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{delivery.deliveryMethod}</TableCell>
                    <TableCell>
                      <Tooltip title={delivery.notes || delivery.complications || "No delivery notes recorded"} arrow>
                        <IconButton size="small" aria-label="View delivery notes">
                          <Notes fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {activeTab === 2 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Visit Date</TableCell>
                  <TableCell>Mother Status</TableCell>
                  <TableCell>Baby Status</TableCell>
                  <TableCell>Next Visit</TableCell>
                  <TableCell>Visit Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {postnatalRecords.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {record.maternityProfile?.patient
                        ? `${record.maternityProfile.patient.firstName} ${record.maternityProfile.patient.lastName}`
                        : "Unknown Patient"}
                    </TableCell>
                    <TableCell>{new Date(record.visitDate).toLocaleDateString()}</TableCell>
                    <TableCell>{record.motherStatus || "Not recorded"}</TableCell>
                    <TableCell>{record.babyStatus || "Not recorded"}</TableCell>
                    <TableCell>
                      {record.nextVisitDate
                        ? new Date(record.nextVisitDate).toLocaleDateString()
                        : "Not scheduled"}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={record.notes || "No visit notes recorded"} arrow>
                        <IconButton size="small" aria-label="View postnatal visit notes">
                          <Notes fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {postnatalRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No postnatal visits recorded</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>


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
                  label="Estimated Due Date"
                  value={calculateEDD(lmp)}
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
                      lastMenstrualPeriod: new Date(lmp).toISOString(),
                      gravida,
                      parity,
                      weightKg: weightKg !== "" ? weightKg : undefined,
                      bpSystolic: bpSystolic !== "" ? bpSystolic : undefined,
                      bpDiastolic: bpDiastolic !== "" ? bpDiastolic : undefined,
                      nextVisitDate: nextVisit.toISOString()
                    });
                    handleCloseDrawer();
                    // Reset form
                    setSelectedPatient("");
                    setLmp("");
                    setGravida(1);
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
                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={() => setNewVisitFormOpen(true)}
                    startIcon={<AddIcon />}
                  >
                    Add New Visit
                  </Button>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel id="delivery-method-label">Delivery method</InputLabel>
                    <Select
                      labelId="delivery-method-label"
                      value={deliveryMethod}
                      label="Delivery method"
                      onChange={(event) => setDeliveryMethod(event.target.value)}
                    >
                      <MenuItem value="VAGINAL">Vaginal</MenuItem>
                      <MenuItem value="CAESAREAN">Caesarean</MenuItem>
                      <MenuItem value="VACUUM">Vacuum</MenuItem>
                      <MenuItem value="FORCEPS">Forceps</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                  {deliveryMethod === "CAESAREAN" && (
                    <Button
                      variant="outlined"
                      onClick={() => setTheaterRequestOpen(true)}
                      disabled={!procedureCatalog.some((item: { isMaternityDelivery: boolean }) => item.isMaternityDelivery)}
                    >
                      Request C-section theater case
                    </Button>
                  )}
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
                    {selectedAncHistory.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.visitDate).toLocaleDateString()}</TableCell>
                        <TableCell>{record.weightKg ?? "—"}</TableCell>
                        <TableCell>
                          {record.bpSystolic && record.bpDiastolic
                            ? `${record.bpSystolic}/${record.bpDiastolic}`
                            : "—"}
                        </TableCell>
                        <TableCell>{record.fetalHeartRate ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {selectedAncHistory.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center">No prior visits recorded</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Drawer>
      <Dialog
        open={theaterRequestOpen}
        onClose={() => setTheaterRequestOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Request Caesarean Theater Case</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            This creates a delivery encounter and sends the case to theater for review. The theater team will assign staff and a room.
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="procedure-catalog-label">Procedure</InputLabel>
            <Select
              labelId="procedure-catalog-label"
              value={selectedProcedureId}
              label="Procedure"
              onChange={(event) => setSelectedProcedureId(event.target.value)}
            >
              {procedureCatalog
                .filter((item: { isMaternityDelivery: boolean }) => item.isMaternityDelivery)
                .map((item: { id: string; name: string; price: number | string }) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} — {Number(item.price).toLocaleString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Requested date and time"
            type="datetime-local"
            value={plannedProcedureDate}
            onChange={(event) => setPlannedProcedureDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Clinical notes"
            multiline
            minRows={3}
            value={theaterRequestNotes}
            onChange={(event) => setTheaterRequestNotes(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTheaterRequestOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={requestCesareanTheaterCase}>
            Send to Theater
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaternityDashboardPage;