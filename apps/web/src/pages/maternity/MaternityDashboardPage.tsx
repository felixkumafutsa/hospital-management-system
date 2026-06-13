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

interface MaternityRecord {
  id: string;
  patientId: string;
  patientName: string;
  lmp: string;
  edd: string;
  gravida: number;
  parity: number;
  status: "ONGOING" | "DELIVERED" | "COMPLICATIONS";
  createdAt: string;
}

const MaternityDashboardPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [lmp, setLmp] = useState("");
  const [gravida, setGravida] = useState<number>(0);
  const [parity, setParity] = useState<number>(0);

  // Fetch all patients for the form
  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const response = await api.get("/patients");
      return response.data.patients;
    },
  });

  // Fetch all ANC (maternity) records
  const { data: maternityRecords, refetch } = useQuery({
    queryKey: ["maternity-records"],
    queryFn: async () => {
      const response = await api.get("/maternity/anc");
      return response.data.data as MaternityRecord[];
    },
  });

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setActiveStep(0);
  };

  const handleOpenAdd = () => {
    setDrawerOpen(true);
  };

  const steps = ["Patient Details", "Pregnancy Information", "Review & Submit"];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Maternity Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          New Pregnancy Record
        </Button>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Total Pregnancies</Typography>
            <Typography variant="h4">
              {maternityRecords?.length || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Ongoing</Typography>
            <Typography variant="h4">
              {maternityRecords?.filter((r) => r.status === "ONGOING").length ||
                0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Delivered</Typography>
            <Typography variant="h4">
              {maternityRecords?.filter((r) => r.status === "DELIVERED")
                .length || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Complications</Typography>
            <Typography variant="h4">
              {maternityRecords?.filter((r) => r.status === "COMPLICATIONS")
                .length || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>EDD</TableCell>
              <TableCell>Gravida</TableCell>
              <TableCell>Parity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {maternityRecords?.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.patientName}</TableCell>
                <TableCell>{record.edd}</TableCell>
                <TableCell>{record.gravida}</TableCell>
                <TableCell>{record.parity}</TableCell>
                <TableCell>{record.status}</TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton size="small">
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
                  label="Last Menstrual Period"
                  type="date"
                  value={lmp}
                  onChange={(e) => setLmp(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
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
                    // Submit the ANC record
                    await api.post("/maternity/anc", {
                      patientId: selectedPatient,
                      lmp: new Date(lmp),
                      gravida,
                      parity,
                      status: "ONGOING",
                    });
                    handleCloseDrawer();
                    // Reset form
                    setSelectedPatient("");
                    setLmp("");
                    setGravida(0);
                    setParity(0);
                    setActiveStep(0);
                    // Refetch records
                    refetch();
                    Swal.fire("Success", "Pregnancy record created", "success");
                  } catch (error) {
                    Swal.fire(
                      "Error",
                      "Failed to create pregnancy record",
                      "error",
                    );
                  }
                } else {
                  // Validate before proceeding to next step
                  if (activeStep === 0 && !selectedPatient) {
                    Swal.fire(
                      "Warning",
                      "Please select a patient first",
                      "warning",
                    );
                    return;
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
    </Box>
  );
};

export default MaternityDashboardPage;
