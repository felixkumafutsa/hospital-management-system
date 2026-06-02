import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Search, Visibility, Add } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  isActive: boolean;
  allergies: string[];
}

const PatientListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, rowsPerPage, searchQuery],
    queryFn: async () => {
      if (searchQuery) {
        const response = await api.get('/patients/search', {
          params: { q: searchQuery, limit: rowsPerPage, offset: page * rowsPerPage }
        });
        return response.data;
      } else {
        const response = await api.get('/patients', {
          params: { limit: rowsPerPage, offset: page * rowsPerPage }
        });
        return response.data;
      }
    }
  });

  const patients: Patient[] = data?.patients || [];
  const totalCount = data?.total || 0;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">Patients</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/patients/register')}
          >
            Register New Patient
          </Button>
        </Box>

        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search by name, patient number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
          />
          <Button type="submit" variant="outlined" startIcon={<Search />}>
            Search
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient Number</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Allergies</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No patients found
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.patientNumber}</TableCell>
                    <TableCell>{patient.firstName} {patient.lastName}</TableCell>
                    <TableCell>{formatDate(patient.dateOfBirth)}</TableCell>
                    <TableCell>{patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={patient.isActive ? 'Active' : 'Inactive'}
                        color={patient.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {patient.allergies.length > 0 ? (
                        <Tooltip title={patient.allergies.join(', ')}>
                          <Chip
                            label={`${patient.allergies.length} allergies`}
                            color="warning"
                            size="small"
                          />
                        </Tooltip>
                      ) : (
                        <Chip label="None" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default PatientListPage;