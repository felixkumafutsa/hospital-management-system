import React from 'react';
import {
  Typography,
  CircularProgress,
  Box,
  Divider,
  IconButton,
  Paper,
  Grid,
  Chip,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';
interface ConsultationDetailsProps {
  consultationId: string;
  onClose: () => void;
}

// Expanded type for detailed consultation view
interface ConsultationDetailsType {
  id: string;
  consultationFee: number | string | null;
  visit: {
    id: string;
    visitDate: string;
    status: string;
    patient: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      gender: string;
    };
    vitals: Array<{
      temperatureC: number | string | null;
      pulseRate: number | null;
      bpSystolic: number | null;
      bpDiastolic: number | null;
      respiratoryRate: number | null;
    }>;
  };
  doctor: { id: string; firstName: string; lastName: string };
  chiefComplaint: string;
  historyOfPC: string | null;
  examination: string | null;
  clinicalNotes: string;
  plan: string | null;
  diagnoses: Array<{ icd10Desc: string; diagnosisType: string }>;
  createdAt: string;
}

const fetchConsultationById = async (id: string): Promise<ConsultationDetailsType> => {
  const { data } = await api.get(`/consultations/${id}`);
  return data.consultation;
};

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Grid item xs={12} sm={6}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body1">{value}</Typography>
  </Grid>
);

const ConsultationDetails = ({ consultationId, onClose }: ConsultationDetailsProps) => {
  const {
    data: consultation,
    isLoading,
    isError,
  } = useQuery<ConsultationDetailsType>({
    queryKey: ['consultation', consultationId],
    queryFn: () => fetchConsultationById(consultationId),
  });

  const vitals = consultation?.visit.vitals || [];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !consultation) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">
          An error occurred while fetching consultation details.
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, width: 450 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={onClose}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 1 }}>
          Consultation Details
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        <DetailItem
          label="Patient"
          value={`${consultation.visit.patient.firstName} ${consultation.visit.patient.lastName}`}
        />
        <DetailItem
          label="Date of Birth"
          value={format(new Date(consultation.visit.patient.dateOfBirth), 'PPP')}
        />
        <DetailItem label="Gender" value={consultation.visit.patient.gender} />
        <DetailItem
          label="Status"
          value={<Chip label={consultation.visit.status} color={consultation.visit.status === 'COMPLETED' ? 'success' : 'warning'} size="small" />}
        />
        <DetailItem
          label="Doctor"
          value={`Dr. ${consultation.doctor.firstName} ${consultation.doctor.lastName}`}
        />
        <DetailItem label="Consultation Fee" value={consultation.consultationFee == null ? "Not recorded" : formatCurrency(consultation.consultationFee)} />
        <DetailItem label="Chief Complaint" value={consultation.chiefComplaint} />
        <DetailItem label="History of Present Illness" value={consultation.historyOfPC || "Not recorded"} />
        <DetailItem label="Physical Exam" value={consultation.examination || "Not recorded"} />
        <DetailItem label="Clinical Notes" value={consultation.clinicalNotes} />
        <DetailItem label="Diagnosis" value={consultation.diagnoses.map((diagnosis) => diagnosis.icd10Desc).join(", ") || "Not recorded"} />
        <DetailItem label="Care Plan" value={consultation.plan || "Not recorded"} />
      </Grid>

      {vitals.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Triage Vitals
          </Typography>
          <Grid container spacing={2}>
            <DetailItem label="Temperature" value={`${vitals[0].temperatureC ?? "N/A"}°C`} />
            <DetailItem label="Pulse" value={`${vitals[0].pulseRate ?? "N/A"} bpm`} />
            <DetailItem label="Blood Pressure" value={`${vitals[0].bpSystolic ?? "N/A"}/${vitals[0].bpDiastolic ?? "N/A"}`} />
            <DetailItem label="Respiration" value={`${vitals[0].respiratoryRate ?? "N/A"} bpm`} />
          </Grid>
        </>
      )}
    </Paper>
  );
};

export default ConsultationDetails;