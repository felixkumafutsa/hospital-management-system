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
  Badge,
} from "@mui/material";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  MedicalServices,
  Schedule,
  Person,
  Visibility,
  Science,
  Biotech as LabTestIcon,
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
  appointments?: Array<{
    doctor: { firstName: string; lastName: string } | null;
  }>;
}

const DoctorDashboardPage = () => {
  const navigate = useNavigate();

  const { data: consultationQueue, isLoading: queueLoading } = useQuery({
    queryKey: ["doctorConsultations"],
    queryFn: async () => {
      const response = await api.get("/visits/queue");
      const queue = response.data.queue ?? response.data.data ?? [];
      return queue as ConsultationQueueItem[];
    },
  });

  const { data: todayConsultations } = useQuery({
    queryKey: ["todayConsultations"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get("/visits", {
        params: { fromDate: today, toDate: today },
      });
      return (response.data.total ?? response.data.visits?.length ?? 0) as number;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "CONSULTING":
      case "AWAITING_LABORATORY":
      case "RESULTS_AVAILABLE":
      case "AWAITING_PHARMACY":
        return "info";
      case "WAITING_FOR_CONSULTATION":
      case "TRIAGED":
        return "warning";
      case "EMERGENCY":
      case "ADMITTED":
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

  const [selectedTab, setSelectedTab] = useState(0);

  const resultsReadyCount = consultationQueue?.filter((v) => v.status === "RESULTS_AVAILABLE").length || 0;
  const waitingCount = consultationQueue?.filter((v) =>
    ["WAITING_FOR_CONSULTATION", "TRIAGED"].includes(v.status)
  ).length || 0;
  const inLabCount = consultationQueue?.filter((v) => v.status === "AWAITING_LABORATORY").length || 0;

  const filteredQueue = consultationQueue?.filter((item) => {
    if (selectedTab === 0) return ["WAITING_FOR_CONSULTATION", "TRIAGED", "CONSULTING"].includes(item.status);
    if (selectedTab === 1) return item.status === "RESULTS_AVAILABLE";
    if (selectedTab === 2) return item.status === "AWAITING_LABORATORY";
    return true; // All active
  }) || [];

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
              title="Waiting for Consultation"
              value={waitingCount}
              icon={Schedule}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Lab Results Ready"
              value={resultsReadyCount}
              icon={Science}
              color="#0288d1"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Under Testing in Lab"
              value={inLabCount}
              icon={LabTestIcon}
              color="#9c27b0"
            />
          </Grid>
        </Grid>

        <Paper sx={{ p: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs value={selectedTab} onChange={(_, val) => setSelectedTab(val)}>
              <Tab label={`Waiting (${waitingCount})`} />
              <Tab
                label={
                  <Badge badgeContent={resultsReadyCount} color="primary">
                    Lab Results Ready&nbsp;&nbsp;
                  </Badge>
                }
              />
              <Tab label={`At Laboratory (${inLabCount})`} />
              <Tab label="All Active" />
            </Tabs>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Patient Number</TableCell>
                  <TableCell>Visit Type</TableCell>
                  <TableCell>Assigned Doctor</TableCell>
                  <TableCell>Triage Notes</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queueLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Loading queue...
                    </TableCell>
                  </TableRow>
                ) : filteredQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No patients in this queue
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQueue.map((item) => (
                    <TableRow key={item.id} sx={item.status === 'RESULTS_AVAILABLE' ? { bgcolor: '#f0f9ff' } : {}}>
                      <TableCell sx={{ fontWeight: item.status === 'RESULTS_AVAILABLE' ? 'bold' : 'normal' }}>
                        {item.patient.firstName} {item.patient.lastName}
                      </TableCell>
                      <TableCell>{item.patient.patientNumber}</TableCell>
                      <TableCell>{item.visitType}</TableCell>
                      <TableCell>
                        {item.appointments?.find((appointment) => appointment.doctor)?.doctor
                          ? `Dr. ${item.appointments.find((appointment) => appointment.doctor)?.doctor?.firstName} ${item.appointments.find((appointment) => appointment.doctor)?.doctor?.lastName}`
                          : item.status === "EMERGENCY" ? "Emergency queue" : "Unassigned"}
                      </TableCell>
                      <TableCell>{item.triageNotes || "N/A"}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          color={getStatusColor(item.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {item.status === 'RESULTS_AVAILABLE' ? (
                          <Button
                            size="small"
                            variant="contained"
                            color="info"
                            startIcon={<Science />}
                            onClick={() =>
                              navigate(`/patients/${item.patient.id}`)
                            }
                          >
                            Review & Prescribe
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() =>
                              navigate(`/patients/${item.patient.id}`)
                            }
                          >
                            Start Consultation
                          </Button>
                        )}
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