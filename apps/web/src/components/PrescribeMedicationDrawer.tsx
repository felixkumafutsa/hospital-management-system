import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Autocomplete,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';

interface MedicationBatch {
  quantityLeft: number;
  sellingPrice: number | string;
  expiresAt: string;
  receivedAt: string;
}

interface Medication {
  id: string;
  name: string;
  stockLevel: number;
  batches: MedicationBatch[];
}

interface PrescribeMedicationDrawerProps {
  open: boolean;
  onClose: () => void;
  visitId: string;
  patientName: string;
}

const PrescribeMedicationDrawer: React.FC<PrescribeMedicationDrawerProps> = ({
  open,
  onClose,
  visitId,
  patientName,
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  const {
    data: medications = [],
    isLoading: isLoadingMedications,
    error: medicationsError,
  } = useQuery<Medication[]>({
    queryKey: ['medications'],
    queryFn: async () => {
      const response = await api.get('/pharmacy/medicines', { params: { limit: 100 } });
      const now = Date.now();
      return (response.data?.data || []).map((medicine: any) => {
        const batches = (medicine.batches || [])
          .filter((batch: MedicationBatch) =>
            Number(batch.quantityLeft) > 0 && new Date(batch.expiresAt).getTime() > now,
          )
          .sort((first: MedicationBatch, second: MedicationBatch) =>
            new Date(first.expiresAt).getTime() - new Date(second.expiresAt).getTime() ||
            new Date(first.receivedAt).getTime() - new Date(second.receivedAt).getTime(),
          );

        return {
          ...medicine,
          batches,
          stockLevel: batches.reduce(
            (total: number, batch: MedicationBatch) => total + Number(batch.quantityLeft),
            0,
          ),
        };
      });
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (prescriptionData: any) => {
      return api.post('/prescriptions', prescriptionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-detail', visitId] });
      Swal.fire({
        icon: 'success',
        title: 'Medication Prescribed',
        text: 'The medication has been successfully prescribed.',
      });
      handleClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to prescribe medication.');
    },
  });

  useEffect(() => {
    if (dosage && frequency && duration) {
      const numDosage = parseInt(dosage.split(' ')[0], 10) || 0;
      const numFrequency = parseInt(frequency.split('x')[0], 10) || 0;
      const numDuration = parseInt(duration.split(' ')[0], 10) || 0;
      if (numDosage > 0 && numFrequency > 0 && numDuration > 0) {
        setQuantity(numDosage * numFrequency * numDuration);
      } else {
        setQuantity('');
      }
    } else {
      setQuantity('');
    }
  }, [dosage, frequency, duration]);

  const handleClose = () => {
    setSelectedMedication(null);
    setDosage('');
    setFrequency('');
    setDuration('');
    setNotes('');
    setQuantity('');
    setError(null);
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMedication || !quantity) {
      setError('Please fill all required fields: Medication and Quantity.');
      return;
    }
    if (Number(quantity) > selectedMedication.stockLevel) {
      setError(`Only ${selectedMedication.stockLevel} units are in stock.`);
      return;
    }
    if (!user) {
      setError('You must be logged in to prescribe medication.');
      return;
    }
    setError(null);
    mutation.mutate({
      visitId,
      prescribedBy: user.id,
      notes,
      items: [
        {
          medicineId: selectedMedication.id,
          dosage,
          frequency,
          duration,
          quantity: Number(quantity),
          notes,
        },
      ],
    });
  };

  const estimatedTotal = (() => {
    if (!selectedMedication || !quantity) return null;
    let remaining = Number(quantity);
    let total = 0;

    for (const batch of selectedMedication.batches) {
      if (remaining <= 0) break;
      const batchQuantity = Math.min(remaining, Number(batch.quantityLeft));
      total += batchQuantity * Number(batch.sellingPrice);
      remaining -= batchQuantity;
    }

    return remaining > 0 ? null : total;
  })();

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}>
      <Box sx={{ width: 500, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Prescribe Medication for {patientName}</Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
        <form onSubmit={handleSubmit}>
          <Box>
            {isLoadingMedications ? (
              <CircularProgress />
            ) : medicationsError ? (
              <Typography color="error">Failed to load medications.</Typography>
            ) : (
              <Autocomplete
                options={medications}
                getOptionDisabled={(option) => option.stockLevel <= 0}
                getOptionLabel={(option) => {
                  const firstBatch = option.batches[0];
                  const price = firstBatch ? ` · from ${formatCurrency(firstBatch.sellingPrice)}/unit` : '';
                  return `${option.name} (In stock: ${option.stockLevel}${price})`;
                }}
                value={selectedMedication}
                onChange={(_, newValue) => {
                  setSelectedMedication(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Medication"
                    margin="normal"
                    error={!!error && !selectedMedication}
                    helperText={!!error && !selectedMedication ? 'Medication is required.' : ''}
                  />
                )}
              />
            )}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                label="Dosage (e.g., '1 tab', '10 ml')"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select value={frequency} label="Frequency" onChange={(e) => setFrequency(e.target.value)}>
                  <MenuItem value="1x Daily">1x Daily</MenuItem>
                  <MenuItem value="2x Daily">2x Daily</MenuItem>
                  <MenuItem value="3x Daily">3x Daily</MenuItem>
                  <MenuItem value="4x Daily">4x Daily</MenuItem>
                  <MenuItem value="As Needed">As Needed</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                label="Duration (e.g., '7 days', '1 month')"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                fullWidth
              />
              <TextField
                label="Calculated Quantity"
                value={quantity}
                InputProps={{ readOnly: true }}
                fullWidth
                error={!!error && !quantity}
                helperText={!!error && !quantity ? 'Quantity is required.' : ''}
              />
            </Box>
            {selectedMedication && quantity !== '' && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Estimated medication amount: {estimatedTotal === null ? 'Not enough stock' : formatCurrency(estimatedTotal)}
              </Typography>
            )}
            <TextField
              margin="normal"
              label="Additional Notes (Optional)"
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
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={mutation.isPending}>
              {mutation.isPending ? <CircularProgress size={24} /> : 'Prescribe'}
            </Button>
          </Box>
        </form>
      </Box>
    </Drawer>
  );
};

export default PrescribeMedicationDrawer;
