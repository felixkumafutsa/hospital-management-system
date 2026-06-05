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
  Science,
  Check,
  Schedule,
  Pending,
  Warning,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import { api } from "../../config/api";

interface LabRequest {
  id: string;
  patientName: string;
  requestedBy: string;
  dateRequested: string;
  tests: LabTest[];
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "ROUTINE" | "URGENT" | "STAT";
  notes: string;
}

interface LabTest {
  id: string;
  testName: string;
  result: string;
  referenceRange: string;
  status: "PENDING" | "COMPLETED";
  price: number;
}

const LabTestsPage = () => {
  const [open, setOpen] = React.useState(false);
  const [selectedLabRequest, setSelectedLabRequest] =
    React.useState<LabRequest | null>(null);

  const { data: labRequests, isLoading } = useQuery({
    queryKey: ["all-lab-requests"],
    queryFn: async () => {
      const res = await api.get("/lab-requests");
      return res.data.requests as LabRequest[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "IN_PROGRESS":
        return "primary";
      case "PENDING":
        return "warning";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "STAT":
        return "error";
      case "URGENT":
        return "warning";
      case "ROUTINE":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Check />;
      case "IN_PROGRESS":
        return <Pending />;
      case "PENDING":
        return <Schedule />;
      default:
        return <Warning />;
    }
  };

  const handleOpenDetails = (request: LabRequest) => {
    setSelectedLabRequest(request);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedLabRequest(null);
  };

  // Calculate stats
  const totalRequests = labRequests?.length || 0;
  const pendingTests =
    labRequests?.filter((r) => r.status === "PENDING").length || 0;
  const inProgress =
    labRequests?.filter((r) => r.status === "IN_PROGRESS").length || 0;
  const completedToday =
    labRequests?.filter((r) => {
      const today = new Date().toDateString();
      return (
        r.status === "COMPLETED" &&
        new Date(r.dateRequested).toDateString() === today
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
              Lab Tests
            </Typography>
            <Typography color="text.secondary">
              Manage laboratory tests, results, and patient diagnostics
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />}>
            New Lab Request
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
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
                      {totalRequests}
                    </Typography>
                    <Typography color="text.secondary">
                      Total Requests
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "50%",
                      backgroundColor: "#1976d220",
                    }}
                  >
                    <Science sx={{ fontSize: 32, color: "#1976d2" }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
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
                      {pendingTests}
                    </Typography>
                    <Typography color="text.secondary">Pending</Typography>
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
          <Grid item xs={12} sm={6} md={3}>
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
                      sx={{ fontWeight: 700, color: "#0288d1" }}
                    >
                      {inProgress}
                    </Typography>
                    <Typography color="text.secondary">In Progress</Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "50%",
                      backgroundColor: "#0288d120",
                    }}
                  >
                    <Pending sx={{ fontSize: 32, color: "#0288d1" }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
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
                      {completedToday}
                    </Typography>
                    <Typography color="text.secondary">
                      Completed Today
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

        {/* Lab Requests Table */}
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
                      Request ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Requested By
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Tests</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {labRequests?.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell sx={{ fontFamily: "monospace" }}>
                        {request.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{request.patientName}</TableCell>
                      <TableCell>{request.requestedBy}</TableCell>
                      <TableCell>
                        {new Date(request.dateRequested).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{request.tests.length} tests</TableCell>
                      <TableCell>
                        <Chip
                          label={request.priority}
                          color={getPriorityColor(request.priority) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(request.status)}
                          label={request.status}
                          color={getStatusColor(request.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details & Add Results">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDetails(request)}
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Lab Request Details Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
          <DialogTitle>
            Lab Request Details
            {selectedLabRequest && (
              <>
                <Chip
                  sx={{ ml: 2 }}
                  label={selectedLabRequest.status}
                  color={getStatusColor(selectedLabRequest.status) as any}
                  size="small"
                />
                <Chip
                  sx={{ ml: 1 }}
                  label={selectedLabRequest.priority}
                  color={getPriorityColor(selectedLabRequest.priority) as any}
                  size="small"
                />
              </>
            )}
          </DialogTitle>
          <DialogContent>
            {selectedLabRequest && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Patient
                    </Typography>
                    <Typography variant="body1">
                      {selectedLabRequest.patientName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Requested By
                    </Typography>
                    <Typography variant="body1">
                      {selectedLabRequest.requestedBy}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Date Requested
                    </Typography>
                    <Typography variant="body1">
                      {new Date(
                        selectedLabRequest.dateRequested,
                      ).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {selectedLabRequest.notes || "None"}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Test Results
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableRow>
                        <TableCell>Test Name</TableCell>
                        <TableCell>Reference Range</TableCell>
                        <TableCell>Result</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedLabRequest.tests.map((test) => (
                        <TableRow key={test.id}>
                          <TableCell>{test.testName}</TableCell>
                          <TableCell>{test.referenceRange}</TableCell>
                          <TableCell>
                            {test.status === "COMPLETED" ? (
                              <Typography sx={{ fontWeight: 500 }}>
                                {test.result}
                              </Typography>
                            ) : (
                              <Typography color="text.secondary">
                                Pending
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={test.status}
                              color={
                                test.status === "COMPLETED"
                                  ? "success"
                                  : "warning"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {test.status !== "COMPLETED" && (
                              <Button size="small" variant="outlined">
                                Add Result
                              </Button>
                            )}
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
            {selectedLabRequest?.status !== "COMPLETED" && (
              <Button
                variant="contained"
                startIcon={<Check />}
                onClick={handleClose}
              >
                Mark All Complete
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default LabTestsPage;
