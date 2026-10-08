import {
  Alert,
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
  Storefront,
} from "@mui/icons-material";
import api from "../../services/api";
import { formatCurrency } from "../../utils/currency";

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
  medicationDue: number | null;
  createdAt: string;
}

interface PharmacyDashboardStats {
  todaySales: { units: number; revenue: number };
  monthSales: { units: number; revenue: number };
  availableUnits: number;
  expiringUnits: number;
  expiredUnits: number;
  pendingPrescriptions: number;
  expiringBatches: Array<{
    id: string;
    medicineName: string;
    batchNumber: string;
    quantityLeft: number;
    expiresAt: string;
  }>;
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
    refetchInterval: 30_000,
  });

  const { data: dashboardStats } = useQuery<PharmacyDashboardStats>({
    queryKey: ["pharmacyDashboardStats"],
    queryFn: async () => {
      const response = await api.get("/pharmacy/dashboard/stats");
      return response.data.data as PharmacyDashboardStats;
    },
  });

  const dispenseMutation = useMutation({
    mutationFn: async (prescriptionId: string) => {
      await api.post(`/prescriptions/${prescriptionId}/dispense`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pharmacyPrescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacyDashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
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
            <Button
              variant="contained"
              startIcon={<Storefront />}
              onClick={() => navigate("/pharmacy/shop")}
            >
              Medicine Shop
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
              value={dashboardStats?.todaySales.units ?? 0}
              icon={CheckCircle}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Available Stock Units"
              value={dashboardStats?.availableUnits ?? 0}
              icon={Inventory}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Sales Today"
              icon={TrendingUp}
              color="#9c27b0"
              value={formatCurrency(dashboardStats?.todaySales.revenue ?? 0)}
            />
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mb: 3 }}>
          Sales this month: {formatCurrency(dashboardStats?.monthSales.revenue ?? 0)} from{" "}
          {dashboardStats?.monthSales.units ?? 0} units sold.
        </Alert>
        {!!dashboardStats?.expiredUnits && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {dashboardStats.expiredUnits} expired unit(s) remain in inventory and are excluded from dispensing.
          </Alert>
        )}
        {!!dashboardStats?.expiringUnits && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {dashboardStats.expiringUnits} unit(s) will expire within the next 30 days.
          </Alert>
        )}
        {dispenseMutation.isError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {dispenseMutation.error instanceof Error
              ? dispenseMutation.error.message
              : "Prescription could not be dispensed."}
          </Alert>
        )}

        {!!dashboardStats?.expiringBatches.length && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Expiring Stock (Next 30 Days)</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Medicine</TableCell>
                    <TableCell>Batch</TableCell>
                    <TableCell>Units</TableCell>
                    <TableCell>Expires</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardStats.expiringBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>{batch.medicineName}</TableCell>
                      <TableCell>{batch.batchNumber}</TableCell>
                      <TableCell>{batch.quantityLeft}</TableCell>
                      <TableCell>{new Date(batch.expiresAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

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
                  <TableCell>Medication Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queueLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Loading prescriptions...
                    </TableCell>
                  </TableRow>
                ) : !prescriptionQueue || prescriptionQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
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
                        {prescription.medicationDue === null
                          ? <Chip label="Invoice missing" color="error" size="small" />
                          : prescription.medicationDue > 0
                          ? <Chip label={formatCurrency(prescription.medicationDue)} color="warning" size="small" />
                          : <Chip label="Paid" color="success" size="small" />}
                      </TableCell>
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
                          disabled={dispenseMutation.isPending || prescription.medicationDue === null || prescription.medicationDue > 0}
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
