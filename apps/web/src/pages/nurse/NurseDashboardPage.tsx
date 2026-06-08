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
  MonitorHeart,
  Schedule,
  Person,
  TrendingUp,
  Edit,
} from "@mui/icons-material";
import api from "../../services/api";

interface TriageQueueItem {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
  };
  visitType: string;
  status: string;
}

const NurseDashboardPage = () => {
  const navigate = useNavigate();

  const { data: triageQueue, isLoading: queueLoading } = useQuery({
    queryKey: ["nurseTriageQueue"],
    queryFn: async () => {
      const response = await api.get("/triage/queue");
      return response.data.queue as TriageQueueItem[];
    },
  });

  const { data: todayTriage } = useQuery({
    queryKey: ["todayTriage"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get("/triage", {
        params: { fromDate: today, toDate: today },
      });
      return response.data.total as number;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TRIAGED":
        return "success";
      case "WAITING_TRIAGE":
        return "warning";
      case "IN_TRIAGE":
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
          <Typography variant="h4">Nurse Dashboard</Typography>
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
              title="Today's Triage"
              value={todayTriage || 0}
              icon={MonitorHeart}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Waiting Triage"
              value={
                triageQueue?.filter((v) => v.status === "WAITING_TRIAGE")
                  .length || 0
              }
              icon={Schedule}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="In Triage"
              value={
                triageQueue?.filter((v) => v.status === "IN_TRIAGE").length || 0
              }
              icon={Person}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Completed"
              value={
                triageQueue?.filter((v) => v.status === "TRIAGED").length || 0
              }
              icon={TrendingUp}
              color="#9c27b0"
            />
          </Grid>
        </Grid>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Patients Waiting for Triage
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Patient Number</TableCell>
                  <TableCell>Visit Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queueLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Loading queue...
                    </TableCell>
                  </TableRow>
                ) : !triageQueue || triageQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No patients waiting for triage
                    </TableCell>
                  </TableRow>
                ) : (
                  triageQueue.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.patient.firstName} {item.patient.lastName}
                      </TableCell>
                      <TableCell>{item.patient.patientNumber}</TableCell>
                      <TableCell>{item.visitType}</TableCell>
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
                          startIcon={<Edit />}
                          onClick={() =>
                            navigate(`/patients/${item.patient.id}`)
                          }
                        >
                          Record Vitals
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

export default NurseDashboardPage;
