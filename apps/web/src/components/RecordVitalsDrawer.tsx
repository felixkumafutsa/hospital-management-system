import React, { useState, useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { MonitorHeart, Close } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Swal from 'sweetalert2';

interface RecordVitalsDrawerProps {
  open: boolean;
  onClose: () => void;
  visitId: string;
  patientName?: string;
  onSuccess?: () => void;
}

export const RecordVitalsDrawer: React.FC<RecordVitalsDrawerProps> = ({
  open,
  onClose,
  visitId,
  patientName,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    bpSystolic: '',
    bpDiastolic: '',
    temperatureC: '',
    pulseRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weightKg: '',
    heightCm: '',
    bloodSugarMmol: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const bmi = useMemo(() => {
    const w = parseFloat(form.weightKg);
    const h = parseFloat(form.heightCm);
    if (w > 0 && h > 0) {
      const hMeters = h / 100;
      return (w / (hMeters * hMeters)).toFixed(1);
    }
    return null;
  }, [form.weightKg, form.heightCm]);

  const recordVitalsMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        visitId,
      };

      if (form.bpSystolic) payload.bpSystolic = parseInt(form.bpSystolic, 10);
      if (form.bpDiastolic) payload.bpDiastolic = parseInt(form.bpDiastolic, 10);
      if (form.temperatureC) payload.temperatureC = parseFloat(form.temperatureC);
      if (form.pulseRate) payload.pulseRate = parseInt(form.pulseRate, 10);
      if (form.respiratoryRate) payload.respiratoryRate = parseInt(form.respiratoryRate, 10);
      if (form.oxygenSaturation) payload.oxygenSaturation = parseInt(form.oxygenSaturation, 10);
      if (form.weightKg) payload.weightKg = parseFloat(form.weightKg);
      if (form.heightCm) payload.heightCm = parseFloat(form.heightCm);
      if (form.bloodSugarMmol) payload.bloodSugarMmol = parseFloat(form.bloodSugarMmol);
      if (form.notes.trim()) payload.notes = form.notes.trim();

      const res = await api.post('/triage/vitals', payload);
      return res.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['nurseTriageQueue'] });
      queryClient.invalidateQueries({ queryKey: ['todayTriage'] });
      queryClient.invalidateQueries({ queryKey: ['visitQueue'] });
      queryClient.invalidateQueries({ queryKey: ['doctorConsultations'] });
      queryClient.invalidateQueries({ queryKey: ['patient-detail'] });
      queryClient.invalidateQueries({ queryKey: ['visit-details'] });

      Swal.fire({
        icon: result.assignmentWarning ? 'warning' : 'success',
        title: result.assignmentWarning ? 'Vitals Recorded - Doctor Assignment Needed' : 'Vitals Recorded',
        text: result.assignmentWarning
          || `Patient assigned to Dr. ${result.appointment.doctor.firstName} ${result.appointment.doctor.lastName} and moved to the consultation queue.`,
        confirmButtonColor: '#0EA5A4',
        ...(result.assignmentWarning ? {} : { timer: 3000 }),
      });

      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || err?.message || 'Failed to record vitals');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitId) {
      setError('No active visit associated with this patient.');
      return;
    }
    recordVitalsMutation.mutate();
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 500, p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MonitorHeart color="primary" />
              <Box>
                <Typography variant="h6">Record Patient Vitals & Triage</Typography>
                {patientName && (
                  <Typography variant="subtitle2" color="text.secondary">
                    Patient: {patientName}
                  </Typography>
                )}
              </Box>
            </Box>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>

          <Box sx={{ mb: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="BP Systolic (mmHg)"
                  name="bpSystolic"
                  type="number"
                  value={form.bpSystolic}
                  onChange={handleChange}
                  placeholder="120"
                  inputProps={{ min: 50, max: 280 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="BP Diastolic (mmHg)"
                  name="bpDiastolic"
                  type="number"
                  value={form.bpDiastolic}
                  onChange={handleChange}
                  placeholder="80"
                  inputProps={{ min: 30, max: 180 }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Heart Rate / Pulse (bpm)"
                  name="pulseRate"
                  type="number"
                  value={form.pulseRate}
                  onChange={handleChange}
                  placeholder="72"
                  inputProps={{ min: 30, max: 240 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Temperature (°C)"
                  name="temperatureC"
                  type="number"
                  value={form.temperatureC}
                  onChange={handleChange}
                  placeholder="36.8"
                  inputProps={{ step: '0.1', min: 30, max: 45 }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Resp. Rate (breaths/min)"
                  name="respiratoryRate"
                  type="number"
                  value={form.respiratoryRate}
                  onChange={handleChange}
                  placeholder="16"
                  inputProps={{ min: 5, max: 60 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Oxygen Saturation (SpO2 %)"
                  name="oxygenSaturation"
                  type="number"
                  value={form.oxygenSaturation}
                  onChange={handleChange}
                  placeholder="98"
                  inputProps={{ min: 50, max: 100 }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  name="weightKg"
                  type="number"
                  value={form.weightKg}
                  onChange={handleChange}
                  placeholder="70"
                  inputProps={{ step: '0.1', min: 1, max: 300 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Height (cm)"
                  name="heightCm"
                  type="number"
                  value={form.heightCm}
                  onChange={handleChange}
                  placeholder="175"
                  inputProps={{ min: 20, max: 250 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="BMI"
                  value={bmi || '—'}
                  disabled
                  helperText={
                    bmi
                      ? parseFloat(bmi) < 18.5
                        ? 'Underweight'
                        : parseFloat(bmi) < 25
                        ? 'Normal'
                        : parseFloat(bmi) < 30
                        ? 'Overweight'
                        : 'Obese'
                      : 'Auto-calculated'
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Random Blood Sugar (mmol/L)"
                  name="bloodSugarMmol"
                  type="number"
                  value={form.bloodSugarMmol}
                  onChange={handleChange}
                  placeholder="5.5"
                  inputProps={{ step: '0.1', min: 0.5, max: 40 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Triage / Nursing Notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Patient general appearance, triage observations, warnings..."
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, p: 2 }}>
            <Button onClick={onClose} disabled={recordVitalsMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={recordVitalsMutation.isPending}
              startIcon={
                recordVitalsMutation.isPending ? <CircularProgress size={16} /> : <MonitorHeart />
              }
            >
              Save Vitals & Complete Triage
            </Button>
          </Box>
        </form>
      </Box>
    </Drawer>
  );
};

export default RecordVitalsDrawer;