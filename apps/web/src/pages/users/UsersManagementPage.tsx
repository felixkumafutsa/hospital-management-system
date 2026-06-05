import React from "react";
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
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Person,
  Lock,
  Visibility,
  AdminPanelSettings,
  MedicalServices,
  Science,
  LocalPharmacy,
  MeetingRoom,
  SupervisorAccount,
} from "@mui/icons-material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import { api } from "../../config/api";

interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
  lastLogin: string;
  createdAt: string;
}

const roleColors: any = {
  admin: "#d32f2f",
  doctor: "#1976d2",
  lab_technician: "#9c27b0",
  pharmacist: "#ed6c02",
  reception: "#2e7d32",
  nurse: "#0288d1",
  accountant: "#7b1fa2",
};

const roleLabels: any = {
  admin: "Admin",
  doctor: "Doctor",
  lab_technician: "Lab Technician",
  pharmacist: "Pharmacist",
  reception: "Reception",
  nurse: "Nurse",
  accountant: "Accountant",
};

const UsersManagementPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<SystemUser | null>(
    null,
  );

  const { data: users, isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data.users as SystemUser[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "error";
      case "LOCKED":
        return "warning";
      default:
        return "default";
    }
  };

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setOpen(true);
  };

  const handleOpenEdit = (user: SystemUser) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  // Calculate stats
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter((u) => u.status === "ACTIVE").length || 0;
  const lockedUsers = users?.filter((u) => u.status === "LOCKED").length || 0;
  const newThisMonth =
    users?.filter((u) => {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return new Date(u.createdAt) > monthAgo;
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
              User Management
            </Typography>
            <Typography color="text.secondary">
              Manage system users, their roles, and access permissions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAdd}
          >
            Add New User
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#1976d2" }}
              >
                {totalUsers}
              </Typography>
              <Typography color="text.secondary">Total Users</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#2e7d32" }}
              >
                {activeUsers}
              </Typography>
              <Typography color="text.secondary">Active</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#ed6c02" }}
              >
                {lockedUsers}
              </Typography>
              <Typography color="text.secondary">Locked</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#9c27b0" }}
              >
                {newThisMonth}
              </Typography>
              <Typography color="text.secondary">New This Month</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Users Table */}
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
                    <TableCell sx={{ fontWeight: "bold" }}>User</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Last Login
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar
                            sx={{ bgcolor: roleColors[user.role] || "#666" }}
                          >
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 500 }}>
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={roleLabels[user.role] || user.role}
                          size="small"
                          sx={{
                            backgroundColor: roleColors[user.role] + "20",
                            color: roleColors[user.role],
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={getStatusColor(user.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(user)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        {user.status === "LOCKED" ? (
                          <Tooltip title="Unlock User">
                            <IconButton size="small" color="success">
                              <Lock />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Lock User">
                            <IconButton size="small" color="warning">
                              <Lock />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete User">
                          <IconButton size="small" color="error">
                            <Delete />
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

        {/* Add/Edit User Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedUser ? "Edit User" : "Add New System User"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
              {selectedUser
                ? "Update the user's information and permissions."
                : "Create a new system user with appropriate role and access."}
            </DialogContentText>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  defaultValue={selectedUser?.firstName || ""}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  defaultValue={selectedUser?.lastName || ""}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  defaultValue={selectedUser?.email || ""}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  defaultValue={selectedUser?.phone || ""}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="System Role"
                  fullWidth
                  defaultValue={selectedUser?.role || ""}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="nurse">Nurse</MenuItem>
                  <MenuItem value="reception">Reception</MenuItem>
                  <MenuItem value="lab_technician">Lab Technician</MenuItem>
                  <MenuItem value="pharmacist">Pharmacist</MenuItem>
                  <MenuItem value="accountant">Accountant</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Account Status"
                  fullWidth
                  defaultValue={selectedUser?.status || "ACTIVE"}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="LOCKED">Locked</MenuItem>
                </TextField>
              </Grid>
              {!selectedUser && (
                <Grid item xs={12}>
                  <TextField
                    label="Temporary Password"
                    type="password"
                    fullWidth
                    helperText="User will be required to change password on first login"
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="contained" onClick={handleClose}>
              {selectedUser ? "Update User" : "Create User"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default UsersManagementPage;
