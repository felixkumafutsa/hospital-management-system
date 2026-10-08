import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Swal from 'sweetalert2';
import OrderLabTestDrawer from './OrderLabTestDrawer';

interface Vitals {
  temperature: number;
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: number;
  recordedAt: string;
}

interface ClinicalConsultationDrawerProps {
  open: boolean;
  onClose: () => void;
  visitId: string;
  patientName: string;
  patientId: string;
}

const ClinicalConsultationDrawer: React.FC<ClinicalConsultationDrawerProps> = ({
  open,
  onClose,
  visitId,
  patientName,
  patientId,
}) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    chiefComplaint: '',
    historyOfPresentIllness: '',
    physicalExam: '',
    clinicalNotes: '',
    primaryDiagnosis: '',
    secondaryDiagnosis: '',
    carePlan: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [labTestDrawerOpen, setLabTestDrawerOpen] = useState(false);

  const { data: vitals, isLoading: vitalsLoading } = useQuery<Vitals[]>({
    queryKey: ['vitals', visitId],
    queryFn: async () => {
      const response = await api.get(`/triage/visit/${visitId}`);
      return response.data.vitals;
    },
    enabled: !!visitId && open,
  });

  const latestVitals = vitals && vitals.length > 0 ? vitals[0] : null;

  const mutation = useMutation({
    mutationFn: (consultationData: typeof form) => {
      return api.post('/consultations', { ...consultationData, visitId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-detail'] });
      queryClient.invalidateQueries({ queryKey: ['visit-details', visitId] });
      Swal.fire({
        icon: 'success',
        title: 'Consultation Saved',
        text: 'The consultation has been successfully saved.',
      });
      onClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to save consultation.');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const handleSendToLab = () => {
    onClose();
    setLabTestDrawerOpen(true);
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box sx={{ width: 600, p: 2 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6">Clinical Consultation</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Patient: {patientName}
                </Typography>
              </Box>
              <IconButton onClick={onClose}>
                <Close />
              </IconButton>
            </Box>

            {vitalsLoading ? (
              <CircularProgress />
            ) : latestVitals ? (
              <Box sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Latest Vitals</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Temperature</Typography>
                    <Typography>{latestVitals.temperature}°C</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Blood Pressure</Typography>
                    <Typography>{latestVitals.bloodPressure}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Heart Rate</Typography>
                    <Typography>{latestVitals.heartRate} bpm</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Resp. Rate</Typography>
                    <Typography>{latestVitals.respiratoryRate} bpm</Typography>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>No vitals recorded for this visit yet.</Alert>
            )}

            <Divider sx={{ mb: 2 }} />

            <Box>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Chief Complaint"
                    name="chiefComplaint"
                    value={form.chiefComplaint}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="History of Present Illness"
                    name="historyOfPresentIllness"
                    value={form.historyOfPresentIllness}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Physical Exam"
                    name="physicalExam"
                    value={form.physicalExam}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Clinical Notes"
                    name="clinicalNotes"
                    value={form.clinicalNotes}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Primary Diagnosis (ICD-10)"
                    name="primaryDiagnosis"
                    value={form.primaryDiagnosis}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Secondary Diagnosis (ICD-10)"
                    name="secondaryDiagnosis"
                    value={form.secondaryDiagnosis}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Care Plan"
                    name="carePlan"
                    value={form.carePlan}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleSendToLab}
                disabled={mutation.isPending}
              >
                Send to Lab
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={mutation.isPending}>
                  {mutation.isPending ? <CircularProgress size={24} /> : 'Save'}
                </Button>
              </Box>
            </Box>
          </form>
        </Box>
      </Drawer>
      <OrderLabTestDrawer
        open={labTestDrawerOpen}
        onClose={() => setLabTestDrawerOpen(false)}
        visitId={visitId}
        patientId={patientId}
        patientName={patientName}
      />
    </>
  );
};

export default ClinicalConsultationDrawer;