import React, { useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Avatar,
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
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Person,
  Visibility,
  Search,
  AdminPanelSettings,
  MedicalServices,
  Science,
  LocalPharmacy,
  MeetingRoom,
  SupervisorAccount,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  status: string;
  phone: string;
  avatar?: string;
}

const StaffManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // New staff form state
  const steps = [
    "Basic Information",
    "Professional Details",
    "Account Settings",
    "Review & Submit",
  ];

  const roleOptions = [
    { value: "ADMIN", label: "Administrator", icon: <AdminPanelSettings /> },
    { value: "DOCTOR", label: "Doctor", icon: <MedicalServices /> },
    { value: "NURSE", label: "Nurse", icon: <SupervisorAccount /> },
    { value: "RECEPTIONIST", label: "Receptionist", icon: <MeetingRoom /> },
    { value: "LAB_TECHNICIAN", label: "Lab Technician", icon: <Science /> },
    { value: "PHARMACIST", label: "Pharmacist", icon: <LocalPharmacy /> },
  ];

  const statusOptions = ["ACTIVE", "INACTIVE", "ON_LEAVE", "SICK"];

  interface StaffFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    role: string;
    department: string;
    employeeId: string;
    hireDate: string;
    salary: number;
    status: string;
  }

  const initialFormData: StaffFormData = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    role: "",
    department: "",
    employeeId: "",
    hireDate: new Date().toISOString().split("T")[0],
    salary: 0,
    status: "ACTIVE",
  };

  const [formData, setFormData] = useState<StaffFormData>(initialFormData);

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

  // Mutation for adding new staff (creates a system user using existing /staff endpoint)
  const addStaffMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      // Transform staff form data to match the API's expected staff creation format
      const staffData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        role: data.role, // Role name is passed correctly to the existing endpoint
        department: data.department,
        employeeId: data.employeeId,
        hireDate: data.hireDate,
        salary: data.salary,
        isActive: data.status === "ACTIVE",
      };
      const res = await api.post("/users", staffData); // Use users endpoint to create system user
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      handleCloseDrawer();
    },
  });

  const handleSubmit = () => {
    addStaffMutation.mutate(formData);
  };

  // Fetch all registered system users from the /users endpoint
  const { data: staffMembers, isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      // The users endpoint returns actual system users from the database
      const res = await api.get("/users");
      // Transform the API response to match the StaffMember interface
      return res.data.data.map((user: any) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role?.name || "UNKNOWN",
        department: user.department || "General",
        status: user.isActive ? "ACTIVE" : "INACTIVE",
        phone: user.phone || "N/A",
        avatar: null,
      })) as StaffMember[];
    },
  });

  // Filter staff based on search term
  const filteredStaff =
    staffMembers?.filter(
      (staff) =>
        `${staff.firstName} ${staff.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.status.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "error";
      case "ON_LEAVE":
        return "warning";
      case "SICK":
        return "info";
      default:
        return "default";
    }
  };

  // Render form steps
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Basic Information
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                multiline
                rows={2}
                value={formData.address}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        );

      case 1: // Professional Details
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                {roleOptions.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Employee ID"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hire Date"
                name="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monthly Salary"
                name="salary"
                type="number"
                value={formData.salary}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        );

      case 2: // Account Settings
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
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
                    {status.replace("_", " ")}
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
                  Staff Member Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Name:</strong> {formData.firstName}{" "}
                      {formData.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Email:</strong> {formData.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Role:</strong> {formData.role}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Department:</strong> {formData.department}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Employee ID:</strong> {formData.employeeId}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Hire Date:</strong>{" "}
                      {new Date(formData.hireDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Status:</strong> {formData.status}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Salary:</strong> $
                      {formData.salary.toLocaleString()}/month
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={addStaffMutation.isPending}
                sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
              >
                {addStaffMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Create Staff Account"
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
            Staff Management
          </Typography>
          <Typography color="text.secondary">
            Manage hospital staff members and their accounts
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
          Add Staff Member
        </Button>
      </Box>

      {/* Search Bar */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search staff by name, email, role, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
        />
      </Paper>

      {/* Staff Table */}
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
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Staff Member
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Department
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStaff
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((staff) => (
                      <TableRow key={staff.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Avatar sx={{ bgcolor: "#0EA5A4" }}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography fontWeight={500}>
                                {staff.firstName} {staff.lastName}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography>{staff.email}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {staff.phone}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={staff.role}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{staff.department}</TableCell>
                        <TableCell>
                          <Chip
                            label={staff.status}
                            color={getStatusColor(staff.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/users/${staff.id}`)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error">
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredStaff.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No staff members found matching your search
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredStaff.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Add Staff Drawer */}
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
            Add New Staff Member
          </Typography>
          <Typography color="text.secondary">
            Fill in the information to create a new staff account
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
                !formData.firstName || !formData.lastName || !formData.email
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

export default StaffManagementPage;
