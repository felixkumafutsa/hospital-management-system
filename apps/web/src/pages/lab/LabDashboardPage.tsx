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
  Science,
  UploadFile,
  TrendingUp,
  CheckCircle,
} from "@mui/icons-material";
import api from "../../services/api";

interface LabRequestItem {
  id: string;
  patient: {
    firstName: string;
    lastName: string;
    patientNumber: string;
  };
  requestedBy: string;
  testTypes: string[];
  status: string;
  requestedAt: string;
  priority: string;
}

const LabDashboardPage = () => {
  const navigate = useNavigate();

  const { data: labRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["labRequests"],
    queryFn: async () => {
      const response = await api.get("/lab/requests", { params: { limit: 100 } });
      const allRequests = response.data?.data ?? response.data?.requests ?? [];
      return allRequests
        .filter((request: any) => ["PENDING", "PROCESSING"].includes(request.status))
        .map((request: any) => ({
          id: request.id,
          patient: {
            firstName: request.visit?.patient?.firstName || "Unknown",
            lastName: request.visit?.patient?.lastName || "Patient",
            patientNumber: request.visit?.patient?.patientNumber || "N/A",
          },
          requestedBy: request.requestedBy || "Unassigned",
          testTypes: (request.items || []).map((item: any) => item.test?.name).filter(Boolean),
          status: request.status,
          requestedAt: request.requestedAt,
          priority: request.priority,
        })) as LabRequestItem[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["labDashboardStats"],
    queryFn: async () => {
      const response = await api.get("/lab/requests/stats");
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "PENDING":
        return "warning";
      case "PROCESSING":
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
        <Typography variant="h4">Laboratory Dashboard</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Science />}
            onClick={() => navigate("/lab-tests")}
          >
            View All Tests
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Tests"
            value={stats?.pending ?? 0}
            icon={Science}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={stats?.processing ?? 0}
            icon={UploadFile}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Today"
            value={stats?.completedToday ?? 0}
            icon={CheckCircle}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completion Rate"
            icon={TrendingUp}
            color="#9c27b0"
            value={`${stats?.completionRate ?? 0}%`}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Active Laboratory Requests
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Patient Number</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Tests Requested</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requestsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Loading lab requests...
                  </TableCell>
                </TableRow>
              ) : !labRequests || labRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No pending laboratory requests
                  </TableCell>
                </TableRow>
              ) : (
                labRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {request.patient.firstName} {request.patient.lastName}
                    </TableCell>
                    <TableCell>{request.patient.patientNumber}</TableCell>
                    <TableCell>{request.requestedBy.slice(0, 8)}</TableCell>
                    <TableCell>{request.testTypes.join(", ")}</TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        color={getStatusColor(request.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<CheckCircle />}
                        variant="outlined"
                        onClick={() => navigate("/lab-tests")}
                      >
                        Open Request
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

export default LabDashboardPage;
