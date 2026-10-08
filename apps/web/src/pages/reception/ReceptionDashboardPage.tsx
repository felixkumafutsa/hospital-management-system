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
  Tabs,
  Tab,
} from "@mui/material";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { People, Schedule, Add, TrendingUp } from "@mui/icons-material";
import api from "../../services/api";
import InvoicesPage from "../finance/InvoicesPage";

interface VisitQueueItem {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
  };
  visitDate: string;
  visitType: string;
  status: string;
  appointments?: Array<{
    doctor: { firstName: string; lastName: string } | null;
  }>;
}

const ReceptionDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ["visitQueue"],
    queryFn: async () => {
      const response = await api.get("/visits/queue");
      return response.data.queue as VisitQueueItem[];
    },
  });

  const { data: todayVisits } = useQuery({
    queryKey: ["todayVisits"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get("/visits", {
        params: { fromDate: today, toDate: today },
      });
      return response.data.total as number;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "error";
      case "CONSULTING":
        return "info";
      case "TRIAGED":
        return "warning";
      case "EMERGENCY":
        return "error";
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
          <Typography variant="h4">Reception Dashboard</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/patients/register")}
            >
              Register Patient
            </Button>
            <Button
              variant="outlined"
              startIcon={<People />}
              onClick={() => navigate("/patients")}
            >
              View All Patients
            </Button>
          </Box>
        </Box>

        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ mb: 2 }}>
          <Tab label="Reception" />
          <Tab label="Cashier" />
        </Tabs>

        {activeTab === 0 ? (
        <>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Today's Visits"
              value={todayVisits || 0}
              icon={Schedule}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Waiting Queue"
              value={
                queueData?.filter((v) =>
                  ["REGISTERED", "WAITING_FOR_CONSULTATION", "TRIAGED"].includes(v.status)
                ).length || 0
              }
              icon={TrendingUp}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="In Consultation"
              value={
                queueData?.filter((v) => v.status === "CONSULTING").length || 0
              }
              icon={People}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Completed Today"
              value={
                queueData?.filter((v) => v.status === "COMPLETED").length || 0
              }
              icon={TrendingUp}
              color="#9c27b0"
            />
          </Grid>
        </Grid>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Current Visit Queue
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Patient Number</TableCell>
                  <TableCell>Visit Type</TableCell>
                  <TableCell>Assigned Doctor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queueLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading queue...
                    </TableCell>
                  </TableRow>
                ) : !queueData || queueData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No active visits in queue
                    </TableCell>
                  </TableRow>
                ) : (
                  queueData.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>
                        {visit.patient.firstName} {visit.patient.lastName}
                      </TableCell>
                      <TableCell>{visit.patient.patientNumber}</TableCell>
                      <TableCell>{visit.visitType}</TableCell>
                      <TableCell>
                        {visit.appointments?.find((appointment) => appointment.doctor)?.doctor
                          ? `Dr. ${visit.appointments.find((appointment) => appointment.doctor)?.doctor?.firstName} ${visit.appointments.find((appointment) => appointment.doctor)?.doctor?.lastName}`
                          : visit.status === "EMERGENCY"
                            ? "Emergency queue"
                            : visit.status === "REGISTERED" ? "Awaiting triage" : "No doctor assigned"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={visit.status}
                          color={getStatusColor(visit.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<People />}
                          onClick={() => navigate(`/patients/${visit.patient.id}`)}
                        >
                          Patient / New Visit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        </>
        ) : (
          <InvoicesPage />
        )}
      </Box>
  );
};

export default ReceptionDashboardPage;
