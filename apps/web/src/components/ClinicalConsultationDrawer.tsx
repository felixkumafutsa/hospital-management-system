import React, { useMemo, useState } from 'react';
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
  MenuItem,
} from '@mui/material';
import { Add, Close, DeleteOutline } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Swal from 'sweetalert2';
import OrderLabTestDrawer from './OrderLabTestDrawer';
import { useAuth } from '../contexts/AuthContext';

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

type FollowUpStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED';
type CompletionMode = 'SAVE' | 'COMPLETED';

interface ConsultationFormState {
  chiefComplaint: string;
  historyOfPC: string;
  examination: string;
  clinicalNotes: string;
  plan: string;
  assignedDoctorId: string;
  diagnoses: Array<{
    icd10Code: string;
    icd10Desc: string;
    diagnosisType: 'PRIMARY' | 'SECONDARY' | 'DIFFERENTIAL';
    notes: string;
  }>;
  followUpDate: string;
  followUpNotes: string;
  followUpStatus: FollowUpStatus;
  status: CompletionMode;
}

const DEFAULT_FORM: ConsultationFormState = {
  chiefComplaint: '',
  historyOfPC: '',
  examination: '',
  clinicalNotes: '',
  plan: '',
  assignedDoctorId: '',
  diagnoses: [],
  followUpDate: '',
  followUpNotes: '',
  followUpStatus: 'SCHEDULED',
  status: 'SAVE',
};

const ClinicalConsultationDrawer: React.FC<ClinicalConsultationDrawerProps> = ({
  open,
  onClose,
  visitId,
  patientName,
  patientId: _patientId,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ConsultationFormState>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [labTestDrawerOpen, setLabTestDrawerOpen] = useState(false);
  const { data: doctors = [] } = useQuery({
    queryKey: ['consultation-doctors'],
    queryFn: async () => {
      const response = await api.get('/users');
      return (response.data.data || []).filter((staff: any) => staff.role?.name === 'DOCTOR');
    },
    enabled: open,
  });

  React.useEffect(() => {
    if (open && user?.id) {
      setForm((current) => ({
        ...current,
        assignedDoctorId: current.assignedDoctorId || user.id,
      }));
    }
  }, [open, user?.id]);

  const { data: vitals, isLoading: vitalsLoading } = useQuery<Vitals[]>({
    queryKey: ['vitals', visitId],
    queryFn: async () => {
      const response = await api.get(`/triage/visit/${visitId}`);
      return response.data.vitals;
    },
    enabled: !!visitId && open,
  });

  const latestVitals = useMemo(() => (vitals && vitals.length > 0 ? vitals[0] : null), [vitals]);

  const mutation = useMutation({
    mutationFn: async (consultationData: ConsultationFormState) => {
      const payload: Record<string, unknown> = {
        visitId,
        chiefComplaint: consultationData.chiefComplaint.trim(),
        historyOfPC: consultationData.historyOfPC.trim() || undefined,
        examination: consultationData.examination.trim() || undefined,
        clinicalNotes: consultationData.clinicalNotes.trim() || undefined,
        plan: consultationData.plan.trim() || undefined,
        followUpDate: consultationData.followUpDate ? new Date(consultationData.followUpDate).toISOString() : undefined,
        followUpNotes: consultationData.followUpNotes.trim() || undefined,
        followUpStatus: consultationData.followUpStatus || undefined,
        assignedDoctorId: consultationData.assignedDoctorId || undefined,
        diagnoses: consultationData.diagnoses
          .filter((diagnosis) => diagnosis.icd10Desc.trim())
          .map((diagnosis) => ({
            icd10Code: diagnosis.icd10Code.trim() || 'N/A',
            icd10Desc: diagnosis.icd10Desc.trim(),
            diagnosisType: diagnosis.diagnosisType,
            notes: diagnosis.notes.trim() || undefined,
          })),
      };

      if (consultationData.status === 'COMPLETED') {
        payload.status = 'COMPLETED';
      }

      if (!payload.chiefComplaint) {
        throw new Error('Chief complaint is required.');
      }

      return api.post('/consultations', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-detail'] });
      queryClient.invalidateQueries({ queryKey: ['visit-details', visitId] });
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      if (form.status === 'COMPLETED') {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      }
      Swal.fire({
        icon: 'success',
        title: 'Consultation saved',
        text: 'The consultation has been successfully saved.',
      });
      handleClose();
    },
    onError: (err: any) => {
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save consultation.',
      );
    },
  });

  const handleClose = () => {
    setError(null);
    setForm(DEFAULT_FORM);
    onClose();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    mutation.mutate(form);
  };

  const handleSendToLab = () => {
    handleClose();
    setLabTestDrawerOpen(true);
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={handleClose}>
        <Box sx={{ width: { xs: '100vw', sm: 600 }, maxWidth: '100vw', p: 2, boxSizing: 'border-box' }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6">Clinical Consultation</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Patient: {patientName}
                </Typography>
              </Box>
              <IconButton onClick={handleClose}>
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
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="History of Present Illness"
                    name="historyOfPC"
                    value={form.historyOfPC}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Examination"
                    name="examination"
                    value={form.examination}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Clinical Notes"
                    name="clinicalNotes"
                    value={form.clinicalNotes}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Plan"
                    name="plan"
                    value={form.plan}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Diagnoses</Typography>
                  {form.diagnoses.map((diagnosis, index) => (
                    <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                      <Grid item xs={4} sm={3}>
                        <TextField
                          fullWidth
                          label="ICD-10 code"
                          value={diagnosis.icd10Code}
                          onChange={(event) => setForm((current) => ({
                            ...current,
                            diagnoses: current.diagnoses.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, icd10Code: event.target.value } : item,
                            ),
                          }))}
                        />
                      </Grid>
                      <Grid item xs={8} sm={4}>
                        <TextField
                          fullWidth
                          label="Description"
                          value={diagnosis.icd10Desc}
                          onChange={(event) => setForm((current) => ({
                            ...current,
                            diagnoses: current.diagnoses.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, icd10Desc: event.target.value } : item,
                            ),
                          }))}
                        />
                      </Grid>
                      <Grid item xs={8} sm={3}>
                        <TextField
                          fullWidth
                          select
                          label="Type"
                          value={diagnosis.diagnosisType}
                          onChange={(event) => setForm((current) => ({
                            ...current,
                            diagnoses: current.diagnoses.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, diagnosisType: event.target.value as typeof item.diagnosisType }
                                : item,
                            ),
                          }))}
                        >
                          {['PRIMARY', 'SECONDARY', 'DIFFERENTIAL'].map((type) => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={4} sm={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton
                          aria-label="Remove diagnosis"
                          color="error"
                          onClick={() => setForm((current) => ({
                            ...current,
                            diagnoses: current.diagnoses.filter((_, itemIndex) => itemIndex !== index),
                          }))}
                        >
                          <DeleteOutline />
                        </IconButton>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Diagnosis notes"
                          value={diagnosis.notes}
                          onChange={(event) => setForm((current) => ({
                            ...current,
                            diagnoses: current.diagnoses.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, notes: event.target.value } : item,
                            ),
                          }))}
                        />
                      </Grid>
                    </Grid>
                  ))}
                  <Button
                    startIcon={<Add />}
                    onClick={() => setForm((current) => ({
                      ...current,
                      diagnoses: [...current.diagnoses, {
                        icd10Code: '',
                        icd10Desc: '',
                        diagnosisType: current.diagnoses.length ? 'SECONDARY' : 'PRIMARY',
                        notes: '',
                      }],
                    }))}
                  >
                    Add diagnosis
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Assigned doctor"
                    name="assignedDoctorId"
                    value={form.assignedDoctorId}
                    onChange={handleChange}
                  >
                    {doctors.map((doctor: any) => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.firstName} {doctor.lastName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Follow-up date"
                    name="followUpDate"
                    type="date"
                    value={form.followUpDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Follow-up status"
                    name="followUpStatus"
                    value={form.followUpStatus}
                    onChange={handleChange}
                  >
                    {(['SCHEDULED', 'COMPLETED', 'MISSED'] as FollowUpStatus[]).map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Follow-up notes"
                    name="followUpNotes"
                    value={form.followUpNotes}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Completion"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <MenuItem value="SAVE">Save only</MenuItem>
                    <MenuItem value="COMPLETED">Complete consultation</MenuItem>
                  </TextField>
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
                <Button onClick={handleClose} disabled={mutation.isPending}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={mutation.isPending}>
                  {mutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Save Consultation'}
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
        patientName={patientName}
        patientId={_patientId}
      />
    </>
  );
};

export default ClinicalConsultationDrawer;
