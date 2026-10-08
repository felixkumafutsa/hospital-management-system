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
  Button,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import { useAppointmentDrawerStore } from '../stores/appointmentDrawerStore';
import { useAuth } from '../contexts/AuthContext';

interface AppointmentDetailsProps {
  appointmentId: string;
}

interface AppointmentDetailsType {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
  appointmentDate: string;
  reasonForVisit?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';
  createdAt: string;
}

const fetchAppointmentById = async (id: string): Promise<AppointmentDetailsType> => {
  const { data } = await api.get(`/appointments/${id}`);
  return data.appointment;
};

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Grid item xs={12} sm={6}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body1" component="div">{value}</Typography>
  </Grid>
);

const AppointmentDetails = ({ appointmentId }: AppointmentDetailsProps) => {
  const { clearSelectedAppointment } = useAppointmentDrawerStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    data: appointment,
    isLoading,
    isError,
  } = useQuery<AppointmentDetailsType>({
    queryKey: ['appointment', appointmentId],
    queryFn: () => fetchAppointmentById(appointmentId),
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!appointment) return;
      await api.patch(`/appointments/${appointment.id}/status`, { status: 'CHECKED_IN' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['nurseTriageQueue'] });
      const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name;
      navigate(roleName === 'RECEPTIONIST' || roleName === 'RECEPTION_CASHIER' ? '/reception' : '/nurse');
    },
  });

  const createConsultationMutation = useMutation({
    mutationFn: async () => {
      if (!appointment) return;
      // First update the appointment status to IN_PROGRESS - this triggers backend logic to sync/create visit
      await api.patch(`/appointments/${appointment.id}/status`, { status: 'IN_PROGRESS' });

      // Then find the active visit
      const { data: visitsData } = await api.get(`/visits?patientId=${appointment.patient.id}`);
      const visits = visitsData.visits || [];
      const activeVisit = visits.find((v: any) => v.status !== 'COMPLETED' && v.status !== 'CANCELLED') || visits[0];

      if (activeVisit) {
        try {
          await api.post('/consultations', {
            visitId: activeVisit.id,
            patientId: appointment.patient.id,
            doctorId: appointment.doctor?.id,
            chiefComplaint: appointment.reasonForVisit || 'Routine checkup',
          });
        } catch (e) {
          // If consultation already exists or error, continue to consultations page
          console.warn('Consultation init note:', e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      clearSelectedAppointment();
      window.location.href = '/consultations';
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !appointment) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6" sx={{ mb: 2 }}>
          Appointment Not Found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          The appointment you're trying to view doesn't exist or may have been deleted.
        </Typography>
        <Button
          variant="contained"
          onClick={clearSelectedAppointment}
          sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
        >
          Close Drawer
        </Button>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, width: 450 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={clearSelectedAppointment}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 1 }}>
          Appointment Details
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        <DetailItem
          label="Patient"
          value={`${appointment.patient.firstName} ${appointment.patient.lastName}`}
        />
        <DetailItem
          label="Status"
          value={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={appointment.status} color={appointment.status === 'COMPLETED' ? 'success' : 'warning'} size="small" />
              {(appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED' || appointment.status === 'CHECKED_IN') && (
                <Chip
                  label="Open for Consultation"
                  color="primary"
                  size="small"
                  sx={{ backgroundColor: '#2e7d32' }}
                />
              )}
            </Box>
          }
        />
        <DetailItem
          label="Doctor"
          value={
            appointment.doctor
              ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
              : 'Unassigned'
          }
        />
        <DetailItem label="Doctor Email" value={appointment.doctor?.email || 'N/A'} />
        <DetailItem label="Reason for Visit" value={appointment.reasonForVisit || 'Not specified'} />
        <DetailItem
          label="Appointment Date"
          value={format(new Date(appointment.appointmentDate), 'PPP')}
        />
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {(appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED') && (
          <Button
            variant="outlined"
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending}
          >
            Check In Patient
          </Button>
        )}
        {appointment.status === 'CHECKED_IN' && (
          <Button
            variant="contained"
            onClick={() => createConsultationMutation.mutate()}
            disabled={createConsultationMutation.isPending}
          >
            Start Consultation
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default AppointmentDetails;