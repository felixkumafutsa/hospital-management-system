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
  Science,
  UploadFile,
  TrendingUp,
  CheckCircle,
  Edit,
} from "@mui/icons-material";
import api from "../../services/api";

interface LabRequestItem {
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
  testTypes: string[];
  status: string;
  requestedAt: string;
}

const LabDashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: labRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["labRequests"],
    queryFn: async () => {
      const response = await api.get("/lab/requests");
      // Filter pending requests
      const allRequests = response.data.requests || [];
      return allRequests.filter(
        (req: any) => req.status === "REQUESTED" || req.status === "COLLECTED",
      ) as LabRequestItem[];
    },
  });

  const { data: todayCompleted } = useQuery({
    queryKey: ["todayLabCompleted"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get("/lab/requests", {
        params: { fromDate: today, toDate: today, status: "COMPLETED" },
      });
      return response.data.requests?.length || 0;
    },
  });

  const completeTestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.put(`/lab/requests/${requestId}/status`, {
        status: "COMPLETED",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labRequests"] });
      queryClient.invalidateQueries({ queryKey: ["todayLabCompleted"] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "PENDING":
        return "warning";
      case "IN_PROGRESS":
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
            onClick={() => navigate("/laboratory/all")}
          >
            View All Tests
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Tests"
            value={
              labRequests?.filter((r) => r.status === "PENDING").length || 0
            }
            icon={Science}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={
              labRequests?.filter((r) => r.status === "IN_PROGRESS").length || 0
            }
            icon={UploadFile}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Today"
            value={todayCompleted || 0}
            icon={CheckCircle}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completion Rate"
            icon={TrendingUp}
            color="#9c27b0"
            value="95%"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Pending Laboratory Requests
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Patient Number</TableCell>
                <TableCell>Requesting Doctor</TableCell>
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
                    <TableCell>
                      Dr. {request.doctor.firstName} {request.doctor.lastName}
                    </TableCell>
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
                        startIcon={<Edit />}
                        variant="contained"
                        onClick={() =>
                          navigate(`/laboratory/requests/${request.id}`)
                        }
                        disabled={completeTestMutation.isPending}
                      >
                        Upload Results
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
