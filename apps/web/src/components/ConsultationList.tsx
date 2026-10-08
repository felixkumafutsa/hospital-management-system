import React from 'react';
import {
  Typography,
  CircularProgress,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { format } from 'date-fns';
import { useConsultationDrawerStore } from '../stores/consultationDrawerStore';

// Define a type for the consultation for better type safety
interface Consultation {
  _id: string;
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  visitId: {
    _id: string;
    visitDate: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  };
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const fetchConsultations = async (): Promise<Consultation[]> => {
  const { data } = await api.get('/consultations');
  return data.consultations || [];
};

const ConsultationList = () => {
  const { selectConsultation } = useConsultationDrawerStore();
  const {
    data: consultations,
    isLoading,
    isError,
  } = useQuery<Consultation[]>({
    queryKey: ['consultations'],
    queryFn: fetchConsultations,
  });

  const getStatusChip = (status: 'PENDING' | 'COMPLETED' | 'CANCELLED') => {
    const color =
      status === 'COMPLETED'
        ? 'success'
        : status === 'PENDING'
        ? 'warning'
        : 'default';
    return <Chip label={status} color={color} size="small" />;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, width: 450 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 2, width: 450 }}>
        <Typography color="error">
          An error occurred while fetching consultations.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: 450 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">
          Consultations & Appointments
        </Typography>
      </Box>
      <Divider />
      <List sx={{ p: 0 }}>
        {consultations && consultations.length > 0 ? (
          consultations.map((consultation, index) => (
            <React.Fragment key={consultation._id}>
              <ListItemButton
                alignItems="flex-start"
                onClick={() => selectConsultation(consultation._id)}
              >
                <ListItemText
                  primary={`Dr. ${consultation.doctor.firstName} ${consultation.doctor.lastName}`}
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {`Patient: ${consultation.patientId.firstName} ${consultation.patientId.lastName}`}
                      </Typography>
                      <br />
                      {`Scheduled: ${format(
                        new Date(consultation.visitId.visitDate),
                        'PPP p'
                      )}`}
                    </>
                  }
                />
                {getStatusChip(consultation.visitId.status)}
              </ListItemButton>
              {index < consultations.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))
        ) : (
          <Typography sx={{ p: 2, color: 'text.secondary' }}>
            No consultations found.
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default ConsultationList;