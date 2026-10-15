import React, { useState, useMemo } from "react";
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
  Alert,
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
  Delete,
  Person,
  Visibility,
  Search,
  FilterList,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface User {
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

interface UserRole {
  id: string;
  name: string;
  displayName: string;
}

const UserManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creationError, setCreationError] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editError, setEditError] = useState("");
  const [archiveError, setArchiveError] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isAdministrator = currentUser?.role.name === "ADMINISTRATOR";

  // New staff form state
  const steps = [
    "Basic Information",
    "Professional Details",
    "Account Settings",
    "Review & Submit",
  ];

  const { data: roleOptions = [], isLoading: rolesLoading, isError: rolesError } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const response = await api.get("/users/roles");
      if (!Array.isArray(response.data?.data)) {
        throw new Error("The user roles response was invalid");
      }
      return response.data.data as UserRole[];
    },
  });

  const statusOptions = ["ACTIVE", "INACTIVE"];

  interface UserFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    address: string;
    role: string;
    department: string;
    employeeId: string;
    hireDate: string;
    salary: number;
    status: string;
  }

  const initialFormData: UserFormData = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    role: "",
    department: "",
    employeeId: "",
    hireDate: new Date().toISOString().split("T")[0],
    salary: 0,
    status: "ACTIVE",
  };

  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    status: "ACTIVE",
  });

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
    setCreationError("");
    setFormData(initialFormData);
  };

  const handleOpenAdd = () => {
    setCreationError("");
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

  // Mutation for adding new user
  const addUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const role = roleOptions.find((item) => item.name === data.role);
      if (!role) {
        throw new Error("Select a valid user role.");
      }
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        roleId: role.id,
        isActive: data.status === "ACTIVE",
      };
      const res = await api.post("/users", userData);
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["all-users"] });
      handleCloseDrawer();
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message ?? error.response?.data?.message
        : error instanceof Error
          ? error.message
          : undefined;
      setCreationError(message || "Unable to create the user account. Please try again.");
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser) return;
      const selectedRole = roleOptions.find((role) => role.name === editFormData.role);
      if (!selectedRole) throw new Error("Select a valid user role.");
      return api.put(`/users/${editingUser.id}`, {
        firstName: editFormData.firstName.trim(),
        lastName: editFormData.lastName.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim() || undefined,
        roleId: selectedRole.id,
        isActive: editFormData.status === "ACTIVE",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setEditingUser(null);
      setEditError("");
    },
    onError: (error) => {
      setEditError(
        axios.isAxiosError(error)
          ? error.response?.data?.error?.message ?? error.response?.data?.message ?? "Unable to update the user."
          : error instanceof Error ? error.message : "Unable to update the user.",
      );
    },
  });

  const archiveUserMutation = useMutation({
    mutationFn: async (userId: string) => api.delete(`/users/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all-users"] }),
    onError: (error) => {
      setArchiveError(
        axios.isAxiosError(error)
          ? error.response?.data?.error?.message ?? error.response?.data?.message ?? "Unable to archive the user."
          : "Unable to archive the user.",
      );
    },
  });

  const openEditDrawer = (staff: User) => {
    setEditingUser(staff);
    setEditError("");
    setEditFormData({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone === "N/A" ? "" : staff.phone,
      role: staff.role,
      status: staff.status,
    });
  };

  const confirmArchiveUser = async (staff: User) => {
    setArchiveError("");
    const result = await Swal.fire({
      title: "Archive this user?",
      text: `${staff.firstName} ${staff.lastName} will be marked inactive and lose account access.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Archive user",
      confirmButtonColor: "#c62828",
    });
    if (result.isConfirmed) archiveUserMutation.mutate(staff.id);
  };

  const handleSubmit = () => {
    addUserMutation.mutate(formData);
  };

  // Fetch all registered system users from the /users endpoint
  const { data: users, isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      // The users endpoint returns actual system users from the database
      const res = await api.get("/users");
      // Transform the API response to match the User interface
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
      })) as User[];
    },
  });

  // Filter users based on search term and filters
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter((user) => {
      // Apply search term filter
      const matchesSearch =
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply role filter
      const matchesRole = !roleFilter || user.role === roleFilter;

      // Apply status filter
      const matchesStatus = !statusFilter || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

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
                disabled={rolesLoading || rolesError || roleOptions.length === 0}
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                {roleOptions.map((role) => (
                  <MenuItem key={role.id} value={role.name}>
                    {role.displayName}
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Initial password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                inputProps={{ minLength: 8 }}
                helperText="Use at least 8 characters. Share it securely with the staff member."
              />
            </Grid>
          </Grid>
        );

      case 3: // Review & Submit
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  User Summary
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
                disabled={addUserMutation.isPending}
                sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
              >
                {addUserMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Create User Account"
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
            User Management
          </Typography>
          <Typography color="text.secondary">
            Manage hospital users and their accounts
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
          Add User
        </Button>
      </Box>

      {/* Search and Filter Bar */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search users by name, email, role, or status..."
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
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={roleFilter}
                label="Filter by Role"
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Roles</MenuItem>
                {roleOptions.map((role) => (
                  <MenuItem key={role.id} value={role.name}>
                    {role.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive / archived</MenuItem>
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

      {archiveError && (
        <Alert severity="error" onClose={() => setArchiveError("")} sx={{ mb: 2 }}>
          {archiveError}
        </Alert>
      )}

      {/* Users Table */}
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
                    <TableCell sx={{ fontWeight: "bold" }}>User</TableCell>
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
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow key={user.id} hover>
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
                                {user.firstName} {user.lastName}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography>{user.email}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.phone}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.status}
                            color={getStatusColor(user.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/users/${user.id}`)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {isAdministrator && (
                            <>
                              <Tooltip title="Edit user">
                                <IconButton size="small" onClick={() => openEditDrawer(user)} aria-label={`Edit ${user.firstName} ${user.lastName}`}>
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              {user.status === "ACTIVE" && (
                                <Tooltip title="Archive user">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      disabled={archiveUserMutation.isPending}
                                      onClick={() => confirmArchiveUser(user)}
                                      aria-label={`Archive ${user.firstName} ${user.lastName}`}
                                    >
                                      <Delete />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No users found matching your search criteria
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
              count={filteredUsers.length}
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
            Add New User
          </Typography>
          <Typography color="text.secondary">
            Fill in the information to create a new user account
          </Typography>
        </Box>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {rolesError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Available staff roles could not be loaded. Close and reopen this
            form, or contact support if the problem continues.
          </Alert>
        )}
        {!rolesLoading && !rolesError && roleOptions.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No staff roles are configured. Configure roles before creating a
            user account.
          </Alert>
        )}
        {!rolesLoading &&
          !rolesError &&
          roleOptions.length > 0 &&
          !roleOptions.some((role) => role.name === "ANESTHETIST") && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              The Anesthetist role is not configured in this database. Apply
              pending database migrations before creating an anesthetist
              account.
            </Alert>
          )}
        {creationError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCreationError("")}>
            {creationError}
          </Alert>
        )}
        {renderStepContent()}
        {activeStep > 0 && activeStep < steps.length - 2 && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              gap: 2,
              justifyContent: "flex-end",
            }}
          >
            <Button onClick={handleBack}>Back</Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={rolesLoading || rolesError || !formData.role}
            >
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
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={formData.password.length < 8}
            >
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

      <Drawer
        anchor="right"
        open={Boolean(editingUser)}
        onClose={() => !editUserMutation.isPending && setEditingUser(null)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, maxWidth: "100vw", p: 3, boxSizing: "border-box" } }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>Edit user account</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Update account details, role, or active status.
        </Typography>
        {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            editUserMutation.mutate();
          }}
          sx={{ display: "grid", gap: 2 }}
        >
          <TextField
            fullWidth required label="First name" value={editFormData.firstName}
            onChange={(event) => setEditFormData((current) => ({ ...current, firstName: event.target.value }))}
          />
          <TextField
            fullWidth required label="Last name" value={editFormData.lastName}
            onChange={(event) => setEditFormData((current) => ({ ...current, lastName: event.target.value }))}
          />
          <TextField
            fullWidth required type="email" label="Email" value={editFormData.email}
            onChange={(event) => setEditFormData((current) => ({ ...current, email: event.target.value }))}
          />
          <TextField
            fullWidth label="Phone" value={editFormData.phone}
            onChange={(event) => setEditFormData((current) => ({ ...current, phone: event.target.value }))}
          />
          <TextField
            fullWidth required select label="Role" value={editFormData.role}
            disabled={rolesLoading || rolesError || roleOptions.length === 0}
            onChange={(event) => setEditFormData((current) => ({ ...current, role: event.target.value }))}
          >
            {roleOptions.map((role) => (
              <MenuItem key={role.id} value={role.name}>{role.displayName}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth select label="Account status" value={editFormData.status}
            onChange={(event) => setEditFormData((current) => ({ ...current, status: event.target.value }))}
          >
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive / archived</MenuItem>
          </TextField>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
            <Button onClick={() => setEditingUser(null)} disabled={editUserMutation.isPending}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={editUserMutation.isPending || !editFormData.role}>
              {editUserMutation.isPending ? <CircularProgress size={21} color="inherit" /> : "Save changes"}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default UserManagementPage;