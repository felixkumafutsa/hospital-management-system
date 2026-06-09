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

  // Fetch all patients for the form
  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const response = await api.get("/patients");
      return response.data.patients;
    },
  });

  // Fetch all maternity records
  const { data: maternityRecords } = useQuery({
    queryKey: ["maternity-records"],
    queryFn: async () => {
      const response = await api.get("/maternity");
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
                  <Select label="Select Patient">
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
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Gravida (Number of pregnancies)"
                  type="number"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Parity (Number of live births)"
                  type="number"
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
              onClick={() => {
                if (activeStep === steps.length - 1) {
                  handleCloseDrawer();
                  Swal.fire("Success", "Pregnancy record created", "success");
                } else {
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
