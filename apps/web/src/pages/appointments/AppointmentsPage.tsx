import React, { useState, useMemo } from "react";

// Helper to decode JWT token to get current user info
const getCurrentUserId = (): string | null => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    // Decode JWT payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || null;
  } catch {
    return null;
  }
};

// Helper to check if current user is a doctor
const isCurrentUserDoctor = (): boolean => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role?.name === 'DOCTOR';
  } catch {
    return false;
  }
};
import {
  Box,
  Paper,
  Typography,
  Button,
  Drawer,
  IconButton,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Visibility,
  Search,
  Close,
} from "@mui/icons-material";
// @ts-ignore - react-big-calendar has React 19 compatibility issues
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// @ts-ignore - CSS import for react-big-calendar
import "react-big-calendar/lib/css/react-big-calendar.css";
import api, { createAppointment } from "../../services/api";
import AppointmentDrawer from "../../components/AppointmentDrawer";
import { useAppointmentDrawerStore } from "../../stores/appointmentDrawerStore";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface Appointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  patient: {
    firstName: string;
    lastName: string;
  };
  doctor: {
    id: string | null;
    firstName: string;
    lastName: string;
  };
  reason: string;
  status: string;
  doctorId?: string;
}

const AppointmentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patientId: "",
    patientName: "",
    doctorId: "",
    doctorName: "",
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
    type: "CONSULTATION",
    status: "SCHEDULED",
  });
  const queryClient = useQueryClient();
  const { openDrawer, selectAppointment } = useAppointmentDrawerStore();

  // Fetch all patients from the system
  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const response = await api.get("/patients");
      return response.data.patients;
    },
  });

  // Fetch all users and filter to only doctors (uses the /users endpoint which returns all system users)
  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      // The /users endpoint returns all system users from the database
      const response = await api.get("/users");
      // Filter to only include users who are doctors (role.name === "DOCTOR")
      const allStaff = response.data.data || [];
      return allStaff.filter((staff: any) => staff.role?.name === "DOCTOR");
    },
  });

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setNewAppointment({
      patientId: "",
      patientName: "",
      doctorId: "",
      doctorName: "",
      date: "",
      startTime: "",
      endTime: "",
      reason: "",
      type: "CONSULTATION",
      status: "SCHEDULED",
    });
  };

  const currentUserId = useMemo(() => getCurrentUserId(), []);
  const userIsDoctor = useMemo(() => isCurrentUserDoctor(), []);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const response = await api.get("/appointments");
      // Transform appointments to calendar format
      return response.data.appointments.map((apt: any) => ({
        id: apt.id,
        title: `${apt.patient.firstName} ${apt.patient.lastName} - ${apt.type || 'Appointment'}`,
        start: new Date(apt.appointmentDate),
        end: new Date(apt.appointmentDate),
        patient: apt.patient,
        doctor: apt.doctor ? {
          id: apt.doctor.id,
          firstName: apt.doctor.firstName,
          lastName: apt.doctor.lastName
        } : { id: null, firstName: "Unassigned", lastName: "" },
        reason: apt.reasonForVisit || apt.notes || "Scheduled appointment",
        status: apt.status,
        doctorId: apt.doctorId, // Include raw doctorId for filtering
      })) as Appointment[];
    },
  });

  // Filter appointments: doctors only see their own appointments, everyone sees all
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];

    let baseFiltered = appointments.filter(
      (apt) =>
        `${apt.patient.firstName} ${apt.patient.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        `${apt.doctor.firstName} ${apt.doctor.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // If current user is a doctor, only show appointments assigned to them
    if (userIsDoctor && currentUserId) {
      baseFiltered = baseFiltered.filter(apt => apt.doctorId === currentUserId);
    }

    return baseFiltered;
  }, [appointments, searchTerm, userIsDoctor, currentUserId]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      await createAppointment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      handleCloseDrawer();
    },
  });

  const handleCreateAppointment = () => {
    // Format data to match what the backend appointment schema expects
    const appointmentData = {
      patientId: newAppointment.patientId,
      doctorId: newAppointment.doctorId || undefined,
      appointmentDate: newAppointment.date, // Send as ISO date string, backend will parse it
      startTime: newAppointment.startTime,
      endTime: newAppointment.endTime,
      type: newAppointment.type,
      notes: newAppointment.reason,
      // If receptionist creates a direct consultation, handle that status properly
      status: newAppointment.status === "DIRECT_CONSULTATION" ? "SCHEDULED" : newAppointment.status,
    };

    createAppointmentMutation.mutate(appointmentData);
  };

  const getEventStyle = (event: Appointment) => {
    let backgroundColor = "#1976d2";
    if (event.status === "COMPLETED") backgroundColor = "#2e7d32";
    if (event.status === "CANCELLED") backgroundColor = "#d32f2f";
    if (event.status === "NO_SHOW") backgroundColor = "#ed6c02";

    return { style: { backgroundColor } };
  };

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <AppointmentDrawer />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Appointments</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDrawerOpen(true)}
          sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
        >
          Schedule New Appointment
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          placeholder="Search appointments by patient, doctor, or reason..."
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Patient</strong>
              </TableCell>
              <TableCell>
                <strong>Doctor</strong>
              </TableCell>
              <TableCell>
                <strong>Date & Time</strong>
              </TableCell>
              <TableCell>
                <strong>Reason</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading appointments...
                </TableCell>
              </TableRow>
            ) : filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No appointments found
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((appointment) => (
                  <TableRow key={appointment.id} hover>
                    <TableCell>
                      {appointment.patient.firstName}{" "}
                      {appointment.patient.lastName}
                    </TableCell>
                    <TableCell>
                      {appointment.doctor.firstName}{" "}
                      {appointment.doctor.lastName}
                    </TableCell>
                    <TableCell>
                      {new Date(appointment.start).toLocaleDateString()} -{" "}
                      {new Date(appointment.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>{appointment.reason || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={appointment.status}
                        color={
                          appointment.status === "COMPLETED"
                            ? "success"
                            : appointment.status === "CANCELLED"
                              ? "error"
                              : appointment.status === "NO_SHOW"
                                ? "warning"
                                : "primary"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            selectAppointment(appointment.id);
                            openDrawer();
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAppointments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Calendar View Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Calendar View
        </Typography>
        <Paper sx={{ p: 3, height: "600px" }}>
          {/* @ts-ignore - react-big-calendar has React 19 compatibility issues */}
          <Calendar
            localizer={localizer}
            events={appointments || []}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            // @ts-ignore - Type compatibility for calendar props
            eventPropGetter={(event: Appointment) => getEventStyle(event)}
            views={["month", "week", "day", "agenda"]}
            defaultView="month"
          />
        </Paper>
      </Box>

      {/* Slide-in drawer for new appointment */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { width: { xs: "100%", md: "500px" }, p: 4 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            New Appointment
          </Typography>
          <IconButton onClick={handleCloseDrawer}>
            <Close />
          </IconButton>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Select Patient</InputLabel>
              <Select
                name="patientId"
                value={newAppointment.patientId}
                label="Select Patient"
                onChange={(e) => {
                  const selectedPatient = patients?.find(
                    (p: any) => p.id === e.target.value,
                  );
                  setNewAppointment({
                    ...newAppointment,
                    patientId: e.target.value,
                    patientName: selectedPatient
                      ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                      : "",
                  });
                }}
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
            <FormControl fullWidth required>
              <InputLabel>Select Doctor</InputLabel>
              <Select
                name="doctorId"
                value={newAppointment.doctorId}
                label="Select Doctor"
                onChange={(e) => {
                  const selectedDoctor = doctors?.find(
                    (d: any) => d.id === e.target.value,
                  );
                  setNewAppointment({
                    ...newAppointment,
                    doctorId: e.target.value,
                    doctorName: selectedDoctor
                      ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}`
                      : "",
                  });
                }}
              >
                {doctors?.map((doctor: any) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              required
              fullWidth
              type="date"
              label="Appointment Date"
              name="date"
              value={newAppointment.date}
              onChange={(e) =>
                setNewAppointment({ ...newAppointment, date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              required
              fullWidth
              type="time"
              label="Start Time"
              name="startTime"
              value={newAppointment.startTime}
              onChange={(e) =>
                setNewAppointment({
                  ...newAppointment,
                  startTime: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              required
              fullWidth
              type="time"
              label="End Time"
              name="endTime"
              value={newAppointment.endTime}
              onChange={(e) =>
                setNewAppointment({
                  ...newAppointment,
                  endTime: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={newAppointment.status}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    status: e.target.value,
                  })
                }
                label="Status"
              >
                <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                <MenuItem value="DIRECT_CONSULTATION">Direct Consultation (Skip Triage)</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="NO_SHOW">No Show</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth required>
              <InputLabel>Appointment Type</InputLabel>
              <Select
                name="type"
                value={newAppointment.type}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    type: e.target.value,
                  })
                }
                label="Appointment Type"
              >
                <MenuItem value="CONSULTATION">Consultation</MenuItem>
                <MenuItem value="FOLLOW_UP">Follow Up</MenuItem>
                <MenuItem value="EMERGENCY">Emergency</MenuItem>
                <MenuItem value="ROUTINE_CHECKUP">Routine Checkup</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              multiline
              rows={4}
              label="Reason for Visit"
              name="reason"
              value={newAppointment.reason}
              onChange={(e) =>
                setNewAppointment({ ...newAppointment, reason: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button variant="outlined" onClick={handleCloseDrawer}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateAppointment}
                sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
              >
                Schedule Appointment
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Drawer>
    </Box>
  );
};

export default AppointmentsPage;