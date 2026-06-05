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
  AdminPanelSettings,
  MedicalServices,
  Science,
  LocalPharmacy,
  MeetingRoom,
  SupervisorAccount,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../services/api";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  department: string;
  joinDate: string;
}

const roleIcons: any = {
  admin: <AdminPanelSettings />,
  doctor: <MedicalServices />,
  lab_technician: <Science />,
  pharmacist: <LocalPharmacy />,
  reception: <MeetingRoom />,
  nurse: <SupervisorAccount />,
  accountant: <Person />,
};

const roleColors: any = {
  admin: "#d32f2f",
  doctor: "#1976d2",
  lab_technician: "#9c27b0",
  pharmacist: "#ed6c02",
  reception: "#2e7d32",
  nurse: "#0288d1",
  accountant: "#7b1fa2",
};

const StaffManagementPage = () => {
  const [open, setOpen] = React.useState(false);
  const [selectedStaff, setSelectedStaff] = React.useState<StaffMember | null>(
    null,
  );

  const { data: staffMembers, isLoading } = useQuery({
    queryKey: ["all-staff"],
    queryFn: async () => {
      const res = await api.get("/users/staff");
      return res.data.users as StaffMember[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "error";
      case "ON_LEAVE":
        return "warning";
      default:
        return "default";
    }
  };

  const handleOpenAdd = () => {
    setSelectedStaff(null);
    setOpen(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStaff(null);
  };

  const totalStaff = staffMembers?.length || 0;
  const activeStaff =
    staffMembers?.filter((s) => s.status === "ACTIVE").length || 0;
  const onLeaveStaff =
    staffMembers?.filter((s) => s.status === "ON_LEAVE").length || 0;
  const inactiveStaff =
    staffMembers?.filter((s) => s.status === "INACTIVE").length || 0;

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
              Staff Management
            </Typography>
            <Typography color="text.secondary">
              Manage all hospital staff members and their permissions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAdd}
          >
            Add Staff Member
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
                {totalStaff}
              </Typography>
              <Typography color="text.secondary">Total Staff</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#2e7d32" }}
              >
                {activeStaff}
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
                {onLeaveStaff}
              </Typography>
              <Typography color="text.secondary">On Leave</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#d32f2f" }}
              >
                {inactiveStaff}
              </Typography>
              <Typography color="text.secondary">Inactive</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Staff Table */}
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
                      Staff Member
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Department
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Join Date</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staffMembers?.map((staff) => (
                    <TableRow key={staff.id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar
                            sx={{ bgcolor: roleColors[staff.role] || "#666" }}
                          >
                            {staff.firstName[0]}
                            {staff.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 500 }}>
                              {staff.firstName} {staff.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {staff.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {roleIcons[staff.role] || <Person />}
                          <Typography sx={{ textTransform: "capitalize" }}>
                            {staff.role?.replace("_", " ")}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{staff.department}</TableCell>
                      <TableCell>{staff.phone}</TableCell>
                      <TableCell>
                        {new Date(staff.joinDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={staff.status}
                          color={getStatusColor(staff.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(staff)}
                          >
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
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Add/Edit Staff Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedStaff ? "Edit Staff Member" : "Add New Staff Member"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
              {selectedStaff
                ? "Update the staff member's information below."
                : "Fill in the information to add a new staff member to the system."}
            </DialogContentText>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  defaultValue={selectedStaff?.firstName || ""}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  defaultValue={selectedStaff?.lastName || ""}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  defaultValue={selectedStaff?.email || ""}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Phone"
                  fullWidth
                  defaultValue={selectedStaff?.phone || ""}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Role"
                  fullWidth
                  defaultValue={selectedStaff?.role || ""}
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
                  label="Status"
                  fullWidth
                  defaultValue={selectedStaff?.status || "ACTIVE"}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="ON_LEAVE">On Leave</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Department"
                  fullWidth
                  defaultValue={selectedStaff?.department || ""}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="contained" onClick={handleClose}>
              {selectedStaff ? "Update" : "Add"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default StaffManagementPage;
