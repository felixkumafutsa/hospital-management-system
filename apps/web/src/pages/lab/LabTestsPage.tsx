import React, { useState, useMemo } from "react";
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
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Drawer,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Add,
  Edit,
  Visibility,
  Search,
  Science,
  FilterList,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createLabRequest, getLabRequests } from "../../services/api";

interface LabTest {
  id: string;
  testNumber: string;
  patientName: string;
  testType: string;
  requestedBy: string;
  status: string;
  priority: string;
  collectedAt: string;
  createdAt: string;
}

const LabTestsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // New lab test form state
  const steps = [
    "Patient & Test Selection",
    "Sample Collection",
    "Results Entry",
    "Review & Submit",
  ];

  const testTypes = [
    "Complete Blood Count (CBC)",
    "Blood Glucose",
    "Lipid Panel",
    "Liver Function",
    "Kidney Function",
    "Urinalysis",
    "COVID-19 PCR",
    "X-Ray",
    "MRI Scan",
    "CT Scan",
    "Other",
  ];

  const statusOptions = [
    "REQUESTED",
    "COLLECTED",
    "PROCESSING",
    "COMPLETED",
    "CANCELLED",
  ];
  const priorityOptions = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  interface LabTestFormData {
    patientId: string;
    doctorId: string;
    testType: string;
    priority: string;
    notes: string;
    collectionNotes: string;
    results: string;
    status: string;
  }

  const initialFormData: LabTestFormData = {
    patientId: "",
    doctorId: "",
    testType: "",
    priority: "MEDIUM",
    notes: "",
    collectionNotes: "",
    results: "",
    status: "REQUESTED",
  };

  const [formData, setFormData] = useState<LabTestFormData>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setActiveStep(0);
    setFormData(initialFormData);
  };

  const handleOpenAdd = () => {
    setDrawerOpen(true);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Mutation for adding new lab test to real API
  const addTestMutation = useMutation({
    mutationFn: async (data: LabTestFormData) => {
      const res = await createLabRequest(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-tests"] });
      handleCloseDrawer();
    },
  });

  const handleSubmit = () => {
    addTestMutation.mutate(formData);
  };

  // Fetch lab tests from real API
  const { data: labTests, isLoading } = useQuery({
    queryKey: ["lab-tests"],
    queryFn: async () => {
      const res = await getLabRequests();
      return res.data.requests.map((test: any) => ({
        id: test.id,
        testNumber: `LAB-${test.id.slice(0, 8).toUpperCase()}`,
        patientName:
          `${test.patient?.firstName || ""} ${test.patient?.lastName || ""}`.trim() ||
          "Unknown",
        testType: test.testType,
        requestedBy: test.doctor
          ? `${test.doctor.firstName} ${test.doctor.lastName}`
          : "Unassigned",
        status: test.status,
        priority: test.priority,
        collectedAt: test.collectedAt,
        createdAt: test.createdAt,
      })) as LabTest[];
    },
  });

  // Filter lab tests based on search term and filters
  const filteredTests = useMemo(() => {
    if (!labTests) return [];

    return labTests.filter((test) => {
      // Apply search term filter
      const matchesSearch =
        test.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.testNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.status.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply status filter
      const matchesStatus = !statusFilter || test.status === statusFilter;

      // Apply priority filter
      const matchesPriority =
        !priorityFilter || test.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [labTests, searchTerm, statusFilter, priorityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "PROCESSING":
        return "primary";
      case "COLLECTED":
        return "info";
      case "REQUESTED":
        return "warning";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "error";
      case "HIGH":
        return "warning";
      case "MEDIUM":
        return "primary";
      case "LOW":
        return "default";
      default:
        return "default";
    }
  };

  // Render form steps
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Patient & Test Selection
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Select Patient"
                name="patientId"
                value={formData.patientId}
                onChange={handleInputChange}
                required
                select
              >
                <MenuItem value="patient-1">John Doe</MenuItem>
                <MenuItem value="patient-2">Jane Smith</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requesting Doctor"
                name="doctorId"
                value={formData.doctorId}
                onChange={handleInputChange}
                required
                select
              >
                <MenuItem value="doctor-1">Dr. James Wilson</MenuItem>
                <MenuItem value="doctor-2">Dr. Sarah Johnson</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Test Type"
                name="testType"
                value={formData.testType}
                onChange={handleInputChange}
                required
              >
                {testTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                {priorityOptions.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Clinical Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Relevant clinical notes for the lab"
              />
            </Grid>
          </Grid>
        );

      case 1: // Sample Collection
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Collection Notes"
                name="collectionNotes"
                value={formData.collectionNotes}
                onChange={handleInputChange}
                placeholder="Notes about sample collection, quality, any issues encountered"
              />
            </Grid>
          </Grid>
        );

      case 2: // Results Entry
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Test Results"
                name="results"
                value={formData.results}
                onChange={handleInputChange}
                placeholder="Enter detailed lab test results"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        );

      case 3: // Review & Submit
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Lab Test Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Patient ID:</strong>{" "}
                      {formData.patientId || "Not selected"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Doctor:</strong>{" "}
                      {formData.doctorId || "Not selected"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Test Type:</strong> {formData.testType}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Priority:</strong> {formData.priority}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Status:</strong> {formData.status}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Results:</strong>{" "}
                      {formData.results || "Not yet entered"}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={addTestMutation.isPending}
                sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
              >
                {addTestMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Create Lab Test Request"
                )}
              </Button>
            </Box>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
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
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
            Laboratory Tests
          </Typography>
          <Typography color="text.secondary">
            Manage lab test requests, samples, and results
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
          New Lab Test
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Total Tests
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {labTests?.length || 0}
                </Typography>
              </Box>
              <Science sx={{ fontSize: 40, color: "#0EA5A4", opacity: 0.5 }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Completed
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {labTests?.filter((test) => test.status === "COMPLETED")
                    .length || 0}
                </Typography>
              </Box>
              <Chip label="Done" color="success" size="small" />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Processing
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {labTests?.filter((test) => test.status === "PROCESSING")
                    .length || 0}
                </Typography>
              </Box>
              <Chip label="Active" color="primary" size="small" />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Urgent
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {labTests?.filter((test) => test.priority === "URGENT")
                    .length || 0}
                </Typography>
              </Box>
              <Chip label="Critical" color="error" size="small" />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Search and Filter Bar */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search lab tests by patient, ID, test type, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replace("_", " ")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Filter by Priority"
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Priorities</MenuItem>
                {priorityOptions.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority.replace("_", " ")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid
            item
            xs={12}
            md={1}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <FilterList sx={{ color: "text.secondary" }} />
          </Grid>
        </Grid>
      </Paper>

      {/* Lab Tests Table */}
      <Paper elevation={2} sx={{ width: "100%", overflow: "hidden" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Lab ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Test Type</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Requested By
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTests
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((test) => (
                      <TableRow key={test.id} hover>
                        <TableCell sx={{ fontFamily: "monospace" }}>
                          {test.testNumber}
                        </TableCell>
                        <TableCell>{test.patientName}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {test.testType.length > 20
                              ? `${test.testType.substring(0, 20)}...`
                              : test.testType}
                          </Typography>
                        </TableCell>
                        <TableCell>{test.requestedBy}</TableCell>
                        <TableCell>
                          <Chip
                            label={test.priority}
                            color={getPriorityColor(test.priority) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={test.status}
                            color={getStatusColor(test.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/lab-tests/${test.id}`)}
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
                  {filteredTests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No lab tests found matching your search
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredTests.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Rows per page:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
              }
            />
          </>
        )}
      </Paper>

      {/* Add Lab Test Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { width: { xs: "100%", md: "600px" }, p: 4 },
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
            Request New Lab Test
          </Typography>
          <Typography color="text.secondary">
            Create a new laboratory test request
          </Typography>
        </Box>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent()}
        {activeStep > 0 && activeStep < steps.length - 1 && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              gap: 2,
              justifyContent: "flex-end",
            }}
          >
            <Button onClick={handleBack}>Back</Button>
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          </Box>
        )}
        {activeStep === steps.length - 2 && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              gap: 2,
              justifyContent: "flex-end",
            }}
          >
            <Button onClick={handleBack}>Back</Button>
            <Button variant="contained" onClick={handleNext}>
              Review
            </Button>
          </Box>
        )}
        {activeStep === 0 && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              gap: 2,
              justifyContent: "flex-end",
            }}
          >
            <Button onClick={handleCloseDrawer}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                !formData.patientId || !formData.doctorId || !formData.testType
              }
            >
              Next
            </Button>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default LabTestsPage;
