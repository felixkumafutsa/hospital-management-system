import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Typography,
  InputAdornment,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import api from '../services/api';

interface AdmitPatientModalProps {
  open: boolean;
  onClose: () => void;
  visitId: string;
  patientName: string;
}

const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({
  open,
  onClose,
  visitId,
  patientName,
}) => {
  const queryClient = useQueryClient();
  const [roomNumber, setRoomNumber] = useState('');
  const [dailyRate, setDailyRate] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (admissionData: { roomNumber: string; dailyRate: number; notes?: string }) => {
      return api.post(`/visits/${visitId}/admit`, admissionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-detail', visitId] });
      Swal.fire({
        icon: 'success',
        title: 'Patient Admitted',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      handleClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to admit patient.');
    },
  });

  const handleClose = () => {
    setRoomNumber('');
    setDailyRate('');
    setNotes('');
    setError(null);
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!roomNumber || !dailyRate) {
      setError('Room Number and Daily Rate are required.');
      return;
    }
    setError(null);
    mutation.mutate({ roomNumber, dailyRate, notes });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Admit {patientName}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Room Number"
            fullWidth
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            error={!!error && !roomNumber}
            helperText={!!error && !roomNumber ? 'Room number is required.' : ''}
          />
          <TextField
            margin="normal"
            label="Daily Rate"
            fullWidth
            type="number"
            value={dailyRate}
            onChange={(e) => setDailyRate(Number(e.target.value))}
            InputProps={{
              startAdornment: <InputAdornment position="start">KES</InputAdornment>,
            }}
            error={!!error && !dailyRate}
            helperText={!!error && !dailyRate ? 'Daily rate is required.' : ''}
          />
          <TextField
            margin="normal"
            label="Admission Notes (Optional)"
            fullWidth
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: '0 24px 16px' }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? <CircularProgress size={24} /> : 'Admit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AdmitPatientModal;