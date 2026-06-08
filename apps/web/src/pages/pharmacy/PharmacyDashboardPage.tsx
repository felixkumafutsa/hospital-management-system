import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  LocalPharmacy,
  Inventory,
  CheckCircle,
  TrendingUp,
  Visibility,
} from "@mui/icons-material";
import api from "../../services/api";

interface PrescriptionQueueItem {
  id: string;
  patient: {
    firstName: string;
    lastName: string;
    patientNumber: string;
  };
  doctor: {
    firstName: string;
    lastName: string;
  };
  medications: number;
  status: string;
  createdAt: string;
}

const PharmacyDashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: prescriptionQueue, isLoading: queueLoading } = useQuery({
    queryKey: ["pharmacyPrescriptions"],
    queryFn: async () => {
      const response = await api.get("/prescriptions/pending");
      return response.data.prescriptions as PrescriptionQueueItem[];
    },
  });

  const { data: todayDispensed } = useQuery({
    queryKey: ["todayDispensed"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get("/prescriptions", {
        params: { fromDate: today, toDate: today, status: "DISPENSED" },
      });
      return response.data.total as number;
    },
  });

  const dispenseMutation = useMutation({
    mutationFn: async (prescriptionId: string) => {
      await api.post(`/prescriptions/${prescriptionId}/dispense`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pharmacyPrescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["todayDispensed"] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DISPENSED":
        return "success";
      case "PENDING":
        return "warning";
      case "PARTIAL":
        return "info";
      default:
        return "default";
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
  }) => (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
          <Box
            sx={{ p: 1, borderRadius: "50%", backgroundColor: `${color}20` }}
          >
            <Icon sx={{ color }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const handleDispense = (id: string) => {
    dispenseMutation.mutate(id);
  };

  return (
      <Box sx={{ width: "100%", mt: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4">Pharmacy Dashboard</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Inventory />}
              onClick={() => navigate("/pharmacy/inventory")}
            >
              View Inventory
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Prescriptions"
              value={
                prescriptionQueue?.filter((p) => p.status === "PENDING")
                  .length || 0
              }
              icon={LocalPharmacy}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Dispensed Today"
              value={todayDispensed || 0}
              icon={CheckCircle}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Medications"
              value={
                prescriptionQueue?.reduce((acc, p) => acc + p.medications, 0) ||
                0
              }
              icon={Inventory}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Processing Rate"
              icon={TrendingUp}
              color="#9c27b0"
              value="100%"
            />
          </Grid>
        </Grid>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Pending Prescriptions to Dispense
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Patient Number</TableCell>
                  <TableCell>Prescribing Doctor</TableCell>
                  <TableCell>Medications</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queueLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading prescriptions...
                    </TableCell>
                  </TableRow>
                ) : !prescriptionQueue || prescriptionQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No pending prescriptions
                    </TableCell>
                  </TableRow>
                ) : (
                  prescriptionQueue.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell>
                        {prescription.patient.firstName}{" "}
                        {prescription.patient.lastName}
                      </TableCell>
                      <TableCell>
                        {prescription.patient.patientNumber}
                      </TableCell>
                      <TableCell>
                        Dr. {prescription.doctor.firstName}{" "}
                        {prescription.doctor.lastName}
                      </TableCell>
                      <TableCell>{prescription.medications} items</TableCell>
                      <TableCell>
                        <Chip
                          label={prescription.status}
                          color={getStatusColor(prescription.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() =>
                            navigate(`/prescriptions/${prescription.id}`)
                          }
                          sx={{ mr: 1 }}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleDispense(prescription.id)}
                          disabled={dispenseMutation.isPending}
                        >
                          Dispense
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
  );
};

export default PharmacyDashboardPage;
