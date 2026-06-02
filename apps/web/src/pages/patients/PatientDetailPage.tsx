import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import { Print, ArrowBack, Add } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Patient {
  id: string;
  patientNumber: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelation: string;
  bloodGroup: string;
  allergies: string[];
  insuranceProvider: string;
  insuranceNumber: string;
  isActive: boolean;
  createdAt: string;
}

interface Visit {
  id: string;
  visitDate: string;
  visitType: string;
  status: string;
}

const PatientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);

  const { data: patientData, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const response = await api.get(`/patients/${id}`);
      return response.data.patient as Patient;
    },
    enabled: !!id
  });

  const { data: visitsData, isLoading: visitsLoading } = useQuery({
    queryKey: ['patientVisits', id],
    queryFn: async () => {
      const response = await api.get(`/visits/patient/${id}`);
      return response.data.visits as Visit[];
    },
    enabled: !!id && tabValue === 1
  });

  if (patientLoading) return <div>Loading...</div>;
  if (!patientData) return <div>Patient not found</div>;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      case 'CONSULTING': return 'info';
      default: return 'warning';
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/patients')}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4">
              {patientData.firstName} {patientData.lastName}
            </Typography>
            <Chip
              label={patientData.isActive ? 'Active' : 'Inactive'}
              color={patientData.isActive ? 'success' : 'error'}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => {/* Create new visit */}}
            >
              New Visit
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={() => window.print()}
            >
              Print Card
            </Button>
          </Box>
        </Box>

        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ mb: 4 }}
        >
          <Tab label="Patient Information" />
          <Tab label="Visit History" />
          <Tab label="Medical Records" />
        </Tabs>

        {tabValue === 0 && (
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Patient Number</Typography>
                  <Typography>{patientData.patientNumber}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">National ID</Typography>
                  <Typography>{patientData.nationalId || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Date of Birth</Typography>
                  <Typography>{formatDate(patientData.dateOfBirth)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Gender</Typography>
                  <Typography>{patientData.gender.charAt(0) + patientData.gender.slice(1).toLowerCase()}</Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Contact Information</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2">Phone</Typography>
                  <Typography>{patientData.phone}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography>{patientData.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2">Address</Typography>
                  <Typography>{patientData.address || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Next of Kin</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2">Name</Typography>
                  <Typography>{patientData.nextOfKinName || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2">Phone</Typography>
                  <Typography>{patientData.nextOfKinPhone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2">Relationship</Typography>
                  <Typography>{patientData.nextOfKinRelation || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Medical Information</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Blood Group</Typography>
                  <Typography>{patientData.bloodGroup || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Allergies</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {patientData.allergies.length > 0 ? patientData.allergies.map((allergy) => (
                      <Chip key={allergy} label={allergy} color="error" size="small" />
                    )) : <Typography>N/A</Typography>}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Insurance Provider</Typography>
                  <Typography>{patientData.insuranceProvider || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Insurance Number</Typography>
                  <Typography>{patientData.insuranceNumber || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Visit Date</TableCell>
                  <TableCell>Visit Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visitsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">Loading...</TableCell>
                  </TableRow>
                ) : !visitsData || visitsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No visits found</TableCell>
                  </TableRow>
                ) : (
                  visitsData.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>{formatDate(visit.visitDate)}</TableCell>
                      <TableCell>{visit.visitType}</TableCell>
                      <TableCell>
                        <Chip
                          label={visit.status}
                          color={getStatusColor(visit.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => navigate(`/visits/${visit.id}`)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 2 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Medical records timeline will be implemented in Phase 3
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PatientDetailPage;