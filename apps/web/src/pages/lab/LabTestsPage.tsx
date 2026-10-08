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
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
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
import api, {
  createLabRequest,
  createLabTest,
  getLabRequests,
  getLabTests,
} from "../../services/api";
import { formatCurrency } from "../../utils/currency";

const labTestCategories = [
  "HEMATOLOGY",
  "BIOCHEMISTRY",
  "MICROBIOLOGY",
  "SEROLOGY",
  "URINALYSIS",
  "PREGNANCY_TEST",
  "HIV_TEST",
  "STI_TEST",
  "IMAGING",
  "OTHER",
] as const;

const getApiErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = error.response;
    if (response && typeof response === "object" && "data" in response) {
      const data = response.data;
      if (data && typeof data === "object" && "error" in data) {
        const apiError = data.error;
        if (
          apiError &&
          typeof apiError === "object" &&
          "message" in apiError &&
          typeof apiError.message === "string"
        ) {
          if ("details" in apiError && Array.isArray(apiError.details)) {
            const messages = apiError.details
              .map((detail: any) => [detail.field, detail.message].filter(Boolean).join(": "))
              .filter(Boolean);
            if (messages.length) return messages.join("; ");
          }
          return apiError.message;
        }
      }
      if (
        data &&
        typeof data === "object" &&
        "message" in data &&
        typeof data.message === "string"
      ) {
        return data.message;
      }
    }
  }

  return error instanceof Error
    ? error.message
    : "The request could not be completed.";
};

interface LabTest {
  id: string;
  testNumber: string;
  patientName: string;
  testIds: string[];
  requestedBy: string;
  status: string;
  priority: string;
  collectedAt: string;
  createdAt: string;
  request: any;
}

const LabTestsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<LabTest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("PENDING");
  const [editNotes, setEditNotes] = useState("");
  const [catalogForm, setCatalogForm] = useState({
    name: "",
    code: "",
    category: "HEMATOLOGY",
    unit: "",
    normalRange: "",
    price: "",
  });
  const queryClient = useQueryClient();

  // Fetch all patients from the system
  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const response = await api.get("/patients");
      return response.data.patients;
    },
  });

  // New lab test form state
  const steps = ["Patient & Test Selection", "Review & Submit"];

  const { data: testTypes } = useQuery({
    queryKey: ["test-types"],
    queryFn: async () => {
      const response = await getLabTests();
      return response.data.tests;
    },
  });

  const statusOptions = ["PENDING", "PROCESSING", "COMPLETED", "REVIEWED", "CANCELLED"];
  const priorityOptions = ["ROUTINE", "URGENT", "STAT"];

  interface LabTestFormData {
    patientId: string;
    visitId: string;
    testIds: string[];
    priority: string;
    notes: string;
  }

  const initialFormData: LabTestFormData = {
    patientId: "",
    visitId: "",
    testIds: [],
    priority: "ROUTINE",
    notes: "",
  };

  const [formData, setFormData] = useState<LabTestFormData>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string | string[]>) => {
    const { name, value } = e.target;

    if (name === "patientId") {
      setFormData((prev) => ({
        ...prev,
        patientId: value as string,
        visitId: "", // Reset visitId when patient changes
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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

  const handleCloseCatalogDialog = () => {
    setCatalogDialogOpen(false);
    setCatalogForm({
      name: "",
      code: "",
      category: "HEMATOLOGY",
      unit: "",
      normalRange: "",
      price: "",
    });
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
      const requestData = {
        visitId: data.visitId,
        testIds: data.testIds,
        priority: data.priority,
        notes: data.notes,
      };
      const res = await createLabRequest(requestData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["labRequests"] });
      queryClient.invalidateQueries({ queryKey: ["labDashboardStats"] });
      handleCloseDrawer();
    },
    onError: (error: unknown) => setMutationError(getApiErrorMessage(error)),
  });

  const createCatalogTestMutation = useMutation({
    mutationFn: async () =>
      createLabTest({
        ...catalogForm,
        price: Number(catalogForm.price),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-types"] });
      handleCloseCatalogDialog();
    },
    onError: (error: unknown) => setMutationError(getApiErrorMessage(error)),
  });

  const updateRequestMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRequest) return;
      return api.put(`/lab/requests/${selectedRequest.id}/status`, {
        status: editStatus,
        notes: editNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-tests"] });
      queryClient.invalidateQueries({ queryKey: ["labRequests"] });
      queryClient.invalidateQueries({ queryKey: ["labDashboardStats"] });
      setEditOpen(false);
      setSelectedRequest(null);
    },
    onError: (error: unknown) => setMutationError(getApiErrorMessage(error)),
  });

  const handleSubmit = () => {
    addTestMutation.mutate(formData);
  };

  const handleCreateCatalogTest = () => {
    createCatalogTestMutation.mutate();
  };

  const openRequestDetails = (request: LabTest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const openRequestEdit = (request: LabTest) => {
    setSelectedRequest(request);
    setEditStatus(request.status);
    setEditNotes(request.request.notes || "");
    setEditOpen(true);
  };

  const {
    data: labTests,
    isLoading,
    error: labRequestsError,
    isError: labRequestsFailed,
  } = useQuery({
    queryKey: ["lab-tests"],
    queryFn: async () => {
      const res = await getLabRequests({ limit: 100 });
      if (!Array.isArray(res.data.data)) {
        throw new Error("Unexpected response while loading laboratory requests.");
      }

      return res.data.data.map((request: any) => ({
        id: request.id,
        testNumber: `LAB-${request.id.slice(0, 8).toUpperCase()}`,
        patientName: `${request.visit?.patient?.firstName || ""} ${request.visit?.patient?.lastName || ""}`.trim() || "Unknown",
        testIds: request.items.map((item: any) => item.test.name),
        requestedBy: request.requestedBy
          ? request.requestedBy.slice(0, 8)
          : "Unassigned",
        status: request.status,
        priority: request.priority,
        collectedAt: request.requestedAt,
        createdAt: request.requestedAt,
        request,
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
        test.testIds.join(" ").toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      case "REVIEWED":
        return "success";
      case "PROCESSING":
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
      case "URGENT":
      case "STAT":
        return "error";
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
              <FormControl fullWidth>
                <InputLabel>Select Patient</InputLabel>
                <Select
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleSelectChange}
                  required
                >
                  {patients?.map((patient: any) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} -{" "}
                      {patient.patientNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth disabled={!formData.patientId}>
                <InputLabel>Visit</InputLabel>
                <Select
                  name="visitId"
                  value={formData.visitId}
                  onChange={handleSelectChange}
                  required
                >
                  {patients
                    ?.find((p: any) => p.id === formData.patientId)
                    ?.visits
                    ?.filter((v: any) => !["COMPLETED", "CANCELLED"].includes(v.status))
                    .map((v: any) => (
                      <MenuItem key={v.id} value={v.id}>
                        {new Date(v.visitDate).toLocaleString()}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tests</InputLabel>
                <Select
                  name="testIds"
                  multiple
                  value={formData.testIds}
                  onChange={handleSelectChange}
                  required
                >
                  {testTypes?.map((test: any) => (
                    <MenuItem key={test.id} value={test.id}>
                      {test.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

      case 1: // Review & Submit
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
                      <strong>Visit:</strong> {formData.visitId || "Not selected"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Tests:</strong>{" "}
                      {testTypes
                        ?.filter((test: any) => formData.testIds.includes(test.id))
                        .map((test: any) => test.name)
                        .join(", ")}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Priority:</strong> {formData.priority}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Clinical Notes:</strong>{" "}
                      {formData.notes || "None"}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button onClick={handleBack} disabled={addTestMutation.isPending}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={addTestMutation.isPending}
                sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
              >
                {addTestMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Create Request"
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
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setCatalogDialogOpen(true)}
          >
            Add Catalogue Test
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
            New Lab Request
          </Button>
        </Box>
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
                  {labRequestsFailed ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Alert severity="error">
                          {getApiErrorMessage(labRequestsError)}
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : filteredTests
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((test) => (
                      <TableRow key={test.id} hover>
                        <TableCell sx={{ fontFamily: "monospace" }}>
                          {test.testNumber}
                        </TableCell>
                        <TableCell>{test.patientName}</TableCell>
                        <TableCell>{test.testIds.join(", ")}</TableCell>
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
                              onClick={() => openRequestDetails(test)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => openRequestEdit(test)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {!labRequestsFailed && filteredTests.length === 0 && (
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

      {/* Create a request against an existing catalog test. */}
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
            Request Laboratory Tests
          </Typography>
          <Typography color="text.secondary">
            Select a patient, visit, and tests for the laboratory queue.
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
                !formData.patientId ||
                !formData.visitId ||
                !formData.testIds.length
              }
            >
              Next
            </Button>
          </Box>
        )}
      </Drawer>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Laboratory Request Details</DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Typography><strong>Request:</strong> {selectedRequest.testNumber}</Typography>
              <Typography><strong>Patient:</strong> {selectedRequest.patientName}</Typography>
              <Typography><strong>Patient number:</strong> {selectedRequest.request.visit?.patient?.patientNumber || "N/A"}</Typography>
              <Typography><strong>Requested:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</Typography>
              <Typography><strong>Requested by:</strong> {selectedRequest.requestedBy}</Typography>
              <Typography><strong>Priority:</strong> {selectedRequest.priority}</Typography>
              <Typography><strong>Status:</strong> {selectedRequest.status}</Typography>
              <Typography><strong>Clinical notes:</strong> {selectedRequest.request.notes || "None"}</Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Tests</Typography>
              {(selectedRequest.request.items || []).map((item: any) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Typography fontWeight={600}>{item.test?.name || "Laboratory test"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.test?.code || ""}{item.test?.category ? ` · ${item.test.category.replace(/_/g, " ")}` : ""}
                    {item.test?.price !== undefined ? ` · ${formatCurrency(Number(item.test.price))}` : ""}
                  </Typography>
                </Paper>
              ))}
              {(selectedRequest.request.results || []).length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Results</Typography>
                  {selectedRequest.request.results.map((result: any) => (
                    <Typography key={result.id} variant="body2">
                      {result.test?.name || "Test"}: {result.value}{result.unit ? ` ${result.unit}` : ""}
                      {result.interpretation ? ` · ${result.interpretation}` : ""}
                    </Typography>
                  ))}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedRequest && <Button onClick={() => { setDetailsOpen(false); openRequestEdit(selectedRequest); }}>Edit Request</Button>}
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Laboratory Request</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
          <TextField select label="Status" value={editStatus} onChange={(event) => setEditStatus(event.target.value)}>
            {statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
          </TextField>
          <TextField label="Clinical notes" multiline rows={3} value={editNotes} onChange={(event) => setEditNotes(event.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => updateRequestMutation.mutate()} disabled={updateRequestMutation.isPending}>
            {updateRequestMutation.isPending ? <CircularProgress size={20} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={catalogDialogOpen}
        onClose={handleCloseCatalogDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Laboratory Test to Catalogue</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
          <TextField
            required
            label="Test name"
            value={catalogForm.name}
            onChange={(event) =>
              setCatalogForm((current) => ({ ...current, name: event.target.value }))
            }
          />
          <TextField
            required
            label="Test code"
            value={catalogForm.code}
            onChange={(event) =>
              setCatalogForm((current) => ({ ...current, code: event.target.value }))
            }
          />
          <TextField
            select
            required
            label="Category"
            value={catalogForm.category}
            onChange={(event) =>
              setCatalogForm((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
          >
            {labTestCategories.map((category) => (
              <MenuItem key={category} value={category}>
                {category.replace(/_/g, " ")}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="number"
            required
            label="Price"
            value={catalogForm.price}
            inputProps={{ min: 0.01, step: 0.01 }}
            onChange={(event) =>
              setCatalogForm((current) => ({ ...current, price: event.target.value }))
            }
          />
          <TextField
            label="Unit"
            value={catalogForm.unit}
            onChange={(event) =>
              setCatalogForm((current) => ({ ...current, unit: event.target.value }))
            }
          />
          <TextField
            label="Normal range"
            value={catalogForm.normalRange}
            onChange={(event) =>
              setCatalogForm((current) => ({
                ...current,
                normalRange: event.target.value,
              }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCatalogDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateCatalogTest}
            disabled={
              createCatalogTestMutation.isPending ||
              !catalogForm.name.trim() ||
              !catalogForm.code.trim() ||
              !catalogForm.price ||
              Number(catalogForm.price) <= 0
            }
          >
            {createCatalogTestMutation.isPending ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Save Test"
            )}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={Boolean(mutationError)}
        autoHideDuration={6000}
        onClose={() => setMutationError("")}
      >
        <Alert severity="error" onClose={() => setMutationError("")}>
          {mutationError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LabTestsPage;
