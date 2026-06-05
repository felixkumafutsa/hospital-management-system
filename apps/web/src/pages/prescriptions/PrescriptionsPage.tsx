import React from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Card,
  CardContent,
} from "@mui/material";
import {
  Add,
  Visibility,
  Edit,
  LocalPharmacy,
  Check,
  Schedule,
  Warning,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import { api } from "../../config/api";

interface Prescription {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  items: PrescriptionItem[];
  status: "PENDING" | "DISPENSED" | "PARTIAL" | "CANCELLED";
  notes: string;
}

interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  quantity: number;
  dispensed: boolean;
  price: number;
}

const PrescriptionsPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selectedPrescription, setSelectedPrescription] =
    React.useState<Prescription | null>(null);

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["all-prescriptions"],
    queryFn: async () => {
      const res = await api.get("/prescriptions");
      return res.data.prescriptions as Prescription[];
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
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DISPENSED":
        return <Check />;
      case "PENDING":
        return <Schedule />;
      case "PARTIAL":
        return <Warning />;
      default:
        return <Schedule />;
    }
  };

  const handleOpenDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPrescription(null);
  };

  // Calculate stats
  const totalPrescriptions = prescriptions?.length || 0;
  const pendingDispensing =
    prescriptions?.filter((p) => p.status === "PENDING").length || 0;
  const dispensedToday =
    prescriptions?.filter((p) => {
      const today = new Date().toDateString();
      return (
        p.status === "DISPENSED" && new Date(p.date).toDateString() === today
      );
    }).length || 0;

  return (
    <MainLayout>
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
              Prescriptions
            </Typography>
            <Typography color="text.secondary">
              Manage patient prescriptions and pharmacy dispensing
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />}>
            New Prescription
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#1976d2" }}
                    >
                      {totalPrescriptions}
                    </Typography>
                    <Typography color="text.secondary">
                      Total Prescriptions
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "50%",
                      backgroundColor: "#1976d220",
                    }}
                  >
                    <LocalPharmacy sx={{ fontSize: 32, color: "#1976d2" }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#ed6c02" }}
                    >
                      {pendingDispensing}
                    </Typography>
                    <Typography color="text.secondary">
                      Pending Dispensing
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "50%",
                      backgroundColor: "#ed6c0220",
                    }}
                  >
                    <Schedule sx={{ fontSize: 32, color: "#ed6c02" }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#2e7d32" }}
                    >
                      {dispensedToday}
                    </Typography>
                    <Typography color="text.secondary">
                      Dispensed Today
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "50%",
                      backgroundColor: "#2e7d3220",
                    }}
                  >
                    <Check sx={{ fontSize: 32, color: "#2e7d32" }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Prescriptions Table */}
        <Paper elevation={2} sx={{ width: "100%", overflow: "hidden" }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Prescription ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Doctor</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Items</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prescriptions?.map((prescription) => {
                    const totalItems = prescription.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    );
                    const totalPrice = prescription.items.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0,
                    );
                    return (
                      <TableRow key={prescription.id} hover>
                        <TableCell sx={{ fontFamily: "monospace" }}>
                          {prescription.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>{prescription.patientName}</TableCell>
                        <TableCell>{prescription.doctorName}</TableCell>
                        <TableCell>
                          {new Date(prescription.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{totalItems} items</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          ${totalPrice.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(prescription.status)}
                            label={prescription.status}
                            color={getStatusColor(prescription.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDetails(prescription)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Prescription Details Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            Prescription Details
            {selectedPrescription && (
              <Chip
                sx={{ ml: 2 }}
                label={selectedPrescription.status}
                color={getStatusColor(selectedPrescription.status) as any}
                size="small"
              />
            )}
          </DialogTitle>
          <DialogContent>
            {selectedPrescription && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Patient
                    </Typography>
                    <Typography variant="body1">
                      {selectedPrescription.patientName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Doctor
                    </Typography>
                    <Typography variant="body1">
                      {selectedPrescription.doctorName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedPrescription.date).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {selectedPrescription.notes || "None"}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Medications
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableRow>
                        <TableCell>Medicine</TableCell>
                        <TableCell>Dosage</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPrescription.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.medicineName}</TableCell>
                          <TableCell>{item.dosage}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            ${(item.price * item.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.dispensed ? "Dispensed" : "Pending"}
                              color={item.dispensed ? "success" : "warning"}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
            {selectedPrescription?.status !== "DISPENSED" && (
              <Button
                variant="contained"
                startIcon={<Check />}
                onClick={handleClose}
              >
                Mark as Dispensed
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default PrescriptionsPage;
