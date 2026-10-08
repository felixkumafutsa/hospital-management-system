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
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import api from '../services/api';

interface DischargePatientModalProps {
  open: boolean;
  onClose: () => void;
  visitId: string;
  patientName: string;
}

const DischargePatientModal: React.FC<DischargePatientModalProps> = ({
  open,
  onClose,
  visitId,
  patientName,
}) => {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (dischargeData: { notes?: string }) => {
      return api.post(`/visits/${visitId}/discharge`, dischargeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-detail', visitId] });
      Swal.fire({
        icon: 'success',
        title: 'Patient Discharged',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      handleClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to discharge patient.');
    },
  });

  const handleClose = () => {
    setNotes('');
    setError(null);
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    mutation.mutate({ notes });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Discharge {patientName}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography>
            Are you sure you want to discharge this patient? This action will finalize the visit and associated charges.
          </Typography>
          <TextField
            margin="normal"
            label="Discharge Notes (Optional)"
            fullWidth
            multiline
            rows={4}
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
          <Button
            type="submit"
            variant="contained"
            color="success"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <CircularProgress size={24} /> : 'Confirm Discharge'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DischargePatientModal;