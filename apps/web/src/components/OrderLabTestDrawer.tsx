import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  FormHelperText,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import api, { getLabTests } from '../services/api';

interface LabTest {
  id: string;
  name: string;
}

interface OrderLabTestDrawerProps {
  open: boolean;
  onClose: () => void;
  visitId: string;
  patientName: string;
  patientId: string;
}

const OrderLabTestDrawer: React.FC<OrderLabTestDrawerProps> = ({
  open,
  onClose,
  visitId,
  patientName,
  patientId: _patientId, // Marked as unused
}) => {
  const queryClient = useQueryClient();
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [priority, setPriority] = useState('Routine');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const {
    data: labTests = [],
    isLoading: isLoadingTests,
    error: testsError,
  } = useQuery<LabTest[]>({
    queryKey: ['lab-tests'],
    queryFn: () => getLabTests().then((res) => res.data.tests || []),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (labOrderData: {
      visitId: string;
      requests: { testId: string }[];
      priority: string;
      notes?: string;
    }) => {
      return api.post('/lab/requests', labOrderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-detail', visitId] });
      Swal.fire({
        icon: 'success',
        title: 'Lab Tests Ordered',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      handleClose();
    },
    onError: (err: any) => {
      setError(
        err?.response?.data?.message || 'Failed to order lab tests.'
      );
    },
  });

  const handleClose = () => {
    setSelectedTestIds([]);
    setPriority('Routine');
    setNotes('');
    setError(null);
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedTestIds.length === 0) {
      setError('Please select at least one lab test.');
      return;
    }
    setError(null);
    const requests = selectedTestIds.map((testId) => ({ testId }));
    mutation.mutate({ visitId, requests, priority, notes });
  };

  const getTestNameById = (id: string) => {
    return labTests.find((test) => test.id === id)?.name;
  };

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}>
      <Box sx={{ width: 500, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Order Lab Tests for {patientName}</Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
        <form onSubmit={handleSubmit}>
          <Box>
            {isLoadingTests ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : testsError ? (
              <Typography color="error">
                Failed to load available lab tests.
              </Typography>
            ) : (
              <>
                <FormControl fullWidth margin="normal" error={!!error && selectedTestIds.length === 0}>
                  <InputLabel id="lab-tests-select-label">Lab Tests</InputLabel>
                  <Select
                    labelId="lab-tests-select-label"
                    multiple
                    value={selectedTestIds}
                    onChange={(e) => setSelectedTestIds(e.target.value as string[])}
                    input={<OutlinedInput label="Lab Tests" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Array.isArray(selected) && (selected as string[]).map((value) => (
                          <Chip key={value} label={getTestNameById(value)} />
                        ))}
                      </Box>
                    )}
                  >
                    {Array.isArray(labTests) && labTests.map((test) => (
                      <MenuItem key={test.id} value={test.id}>
                        {test.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {!!error && selectedTestIds.length === 0 && <FormHelperText>{error}</FormHelperText>}
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel id="priority-select-label">Priority</InputLabel>
                  <Select
                    labelId="priority-select-label"
                    value={priority}
                    label="Priority"
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <MenuItem value="Routine">Routine</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                    <MenuItem value="STAT">STAT</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  margin="normal"
                  label="Clinical Notes (Optional)"
                  fullWidth
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </>
            )}
            {error && selectedTestIds.length > 0 && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={mutation.isPending || isLoadingTests}
            >
              {mutation.isPending ? <CircularProgress size={24} /> : 'Order Tests'}
            </Button>
          </Box>
        </form>
      </Box>
    </Drawer>
  );
};

export default OrderLabTestDrawer;