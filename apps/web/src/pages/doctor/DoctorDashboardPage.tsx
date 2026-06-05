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
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  MedicalServices,
  Schedule,
  Person,
  TrendingUp,
  Visibility,
} from "@mui/icons-material";
import api from "../../services/api";

interface ConsultationQueueItem {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
  };
  visitType: string;
  status: string;
  triageNotes?: string;
}

const DoctorDashboardPage = () => {
  const navigate = useNavigate();

  const { data: consultationQueue, isLoading: queueLoading } = useQuery({
    queryKey: ["doctorConsultations"],
    queryFn: async () => {
      const response = await api.get("/consultations/queue");
      return response.data.queue as ConsultationQueueItem[];
    },
  });

  const { data: todayConsultations } = useQuery({
    queryKey: ["todayConsultations"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get("/consultations", {
        params: { fromDate: today, toDate: today },
      });
      return response.data.total as number;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "IN_PROGRESS":
        return "info";
      case "WAITING":
        return "warning";
      case "PRESCRIBED":
        return "primary";
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
        <Typography variant="h4">Doctor Dashboard</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Person />}
            onClick={() => navigate("/patients")}
          >
            View All Patients
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Consultations"
            value={todayConsultations || 0}
            icon={MedicalServices}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Waiting"
            value={
              consultationQueue?.filter((v) => v.status === "WAITING").length ||
              0
            }
            icon={Schedule}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={
              consultationQueue?.filter((v) => v.status === "IN_PROGRESS")
                .length || 0
            }
            icon={Person}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={
              consultationQueue?.filter((v) => v.status === "COMPLETED")
                .length || 0
            }
            icon={TrendingUp}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Patients Waiting for Consultation
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Patient Number</TableCell>
                <TableCell>Visit Type</TableCell>
                <TableCell>Triage Notes</TableCell>
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
              ) : !consultationQueue || consultationQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No patients waiting for consultation
                  </TableCell>
                </TableRow>
              ) : (
                consultationQueue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.patient.firstName} {item.patient.lastName}
                    </TableCell>
                    <TableCell>{item.patient.patientNumber}</TableCell>
                    <TableCell>{item.visitType}</TableCell>
                    <TableCell>{item.triageNotes || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/patients/${item.patient.id}`)}
                      >
                        Start Consultation
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
export default DoctorDashboardPage;
