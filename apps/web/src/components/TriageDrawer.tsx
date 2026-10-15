import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

interface TriageDrawerProps {
  open: boolean;
  onClose: () => void;
  appointment: any;
}

const TriageDrawer: React.FC<TriageDrawerProps> = ({
  open,
  onClose,
  appointment,
}) => {
  const [vitals, setVitals] = useState({
    temperature: "",
    bloodPressure: "",
    heartRate: "",
    respiratoryRate: "",
    oxygenSaturation: "",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (appointment) {
      // You can pre-fill vitals if they exist on the appointment
    }
  }, [appointment]);

  const recordVitalsMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/triage", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      onClose();
    },
  });

  const handleRecordVitals = () => {
    recordVitalsMutation.mutate({
      patientId: appointment.patient.id,
      appointmentId: appointment.id,
      ...vitals,
    });
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Triage & Vitals</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1">
              Patient: {appointment?.patient?.firstName}{" "}
              {appointment?.patient?.lastName}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Temperature (°C)"
              fullWidth
              value={vitals.temperature}
              onChange={(e) =>
                setVitals({ ...vitals, temperature: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Blood Pressure"
              fullWidth
              value={vitals.bloodPressure}
              onChange={(e) =>
                setVitals({ ...vitals, bloodPressure: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Heart Rate (bpm)"
              fullWidth
              value={vitals.heartRate}
              onChange={(e) =>
                setVitals({ ...vitals, heartRate: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Respiratory Rate"
              fullWidth
              value={vitals.respiratoryRate}
              onChange={(e) =>
                setVitals({ ...vitals, respiratoryRate: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Oxygen Saturation (%)"
              fullWidth
              value={vitals.oxygenSaturation}
              onChange={(e) =>
                setVitals({ ...vitals, oxygenSaturation: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleRecordVitals}
              disabled={recordVitalsMutation.isPending}
            >
              Record Vitals
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  );
};

export default TriageDrawer;