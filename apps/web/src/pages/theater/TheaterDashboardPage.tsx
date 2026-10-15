import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  FormControl,
  FormControlLabel,

  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../services/api";
import PrescribeMedicationDrawer from "../../components/PrescribeMedicationDrawer";
import OrderLabTestDrawer from "../../components/OrderLabTestDrawer";
import { useAuth } from "../../contexts/AuthContext";

interface ProcedureCatalogItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number | string;
  durationMinutes: number;
  isMaternityDelivery: boolean;
}

interface SurgicalProcedure {
  id: string;
  visitId: string;
  procedureName: string;
  procedureDate: string;
  procedureFee?: number | string | null;
  theaterId: string | null;
  surgeonId: string | null;
  anesthetistId: string | null;
  status: string;
  theater?: { name: string } | null;
  catalog?: ProcedureCatalogItem | null;
  surgeon?: { firstName: string; lastName: string } | null;
  anesthetist?: { firstName: string; lastName: string } | null;
  notes?: string | null;
  visit: {
    patient: { id: string; firstName: string; lastName: string; patientNumber: string };
  };
}

interface TheaterResource {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

const toLocalDateTime = (value?: string) => {
  const date = value ? new Date(value) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
};

const getCaseStatusColor = (
  status: string,
): "default" | "info" | "primary" | "warning" | "success" | "error" => {
  switch (status) {
    case "REQUESTED":
      return "info";
    case "SCHEDULED":
      return "primary";
    case "IN_PROGRESS":
      return "warning";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "error";
    default:
      return "default";
  }
};

const getCasePatient = (procedure: SurgicalProcedure) =>
  procedure.visit?.patient
    ? `${procedure.visit.patient.firstName} ${procedure.visit.patient.lastName} (${procedure.visit.patient.patientNumber})`
    : procedure.visitId;

const getCasePrice = (procedure: SurgicalProcedure) =>
  procedure.procedureFee != null
    ? Number(procedure.procedureFee).toLocaleString()
    : procedure.catalog
      ? Number(procedure.catalog.price).toLocaleString()
      : "Not priced";

const TheaterDashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const theme = useTheme();
  const smallViewport = useMediaQuery(theme.breakpoints.down("md"));
  const isAdministrator = user?.role.name === "ADMINISTRATOR";
  const canOperateTheater = ["ADMINISTRATOR", "DOCTOR", "NURSE", "ANESTHETIST"].includes(user?.role.name ?? "");
  const [activeTab, setActiveTab] = useState(0);
  const [scheduleCase, setScheduleCase] = useState<SurgicalProcedure | null>(null);
  const [scheduleDate, setScheduleDate] = useState(toLocalDateTime());
  const [theaterId, setTheaterId] = useState("");
  const [surgeonId, setSurgeonId] = useState("");
  const [anesthetistId, setAnesthetistId] = useState("");
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [editingCatalogId, setEditingCatalogId] = useState("");
  const [catalogCode, setCatalogCode] = useState("");
  const [catalogName, setCatalogName] = useState("");
  const [catalogDescription, setCatalogDescription] = useState("");
  const [catalogPrice, setCatalogPrice] = useState("");
  const [catalogDuration, setCatalogDuration] = useState("60");
  const [catalogIsMaternityDelivery, setCatalogIsMaternityDelivery] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<SurgicalProcedure | null>(null);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [labDrawerOpen, setLabDrawerOpen] = useState(false);
  const [createRequestError, setCreateRequestError] = useState("");
  const [requestPatientId, setRequestPatientId] = useState("");
  const [requestVisitId, setRequestVisitId] = useState("");
  const [requestCatalogId, setRequestCatalogId] = useState("");
  const [requestDate, setRequestDate] = useState(toLocalDateTime());
  const [requestNotes, setRequestNotes] = useState("");

  const { data: procedures = [], isLoading, isError } = useQuery({
    queryKey: ["theater-procedures"],
    queryFn: async () => {
      const response = await api.get("/theater");
      return response.data as SurgicalProcedure[];
    },
  });

  useEffect(() => {
    if (selectedProcedure) {
      const refreshed = procedures.find((procedure) => procedure.id === selectedProcedure.id);
      if (refreshed && refreshed !== selectedProcedure) setSelectedProcedure(refreshed);
    }
  }, [procedures, selectedProcedure]);

  const {
    data: catalog = [],
    isLoading: catalogLoading,
    isError: catalogError,
  } = useQuery({
    queryKey: ["theater-procedure-catalog"],
    queryFn: async () => {
      const response = await api.get("/theater/catalog");
      return response.data as ProcedureCatalogItem[];
    },
  });

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => (await api.get("/patients")).data.patients || [],
    enabled: createRequestOpen,
  });

  const { data: visits = [], isLoading: visitsLoading } = useQuery({
    queryKey: ["theater-request-visits"],
    queryFn: async () => (await api.get("/visits")).data.visits || [],
    enabled: createRequestOpen,
  });

  const requestVisits = visits.filter((visit: any) => visit.patientId === requestPatientId);

  const {
    data: resources,
    isLoading: resourcesLoading,
    isError: resourcesError,
  } = useQuery({
    queryKey: ["theater-resources"],
    queryFn: async () => {
      const response = await api.get("/theater/resources");
      return response.data as {
        theaters: TheaterResource[];
        surgeons: TheaterResource[];
        anesthetists: TheaterResource[];
      };
    },
  });

  const refreshProcedures = () => queryClient.invalidateQueries({ queryKey: ["theater-procedures"] });
  const createRequestMutation = useMutation({
    mutationFn: async () => {
      await api.post("/theater/requests", {
        visitId: requestVisitId,
        catalogId: requestCatalogId,
        procedureDate: new Date(requestDate).toISOString(),
        notes: requestNotes.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await refreshProcedures();
      setCreateRequestOpen(false);
      setCreateRequestError("");
      setRequestPatientId("");
      setRequestVisitId("");
      setRequestCatalogId("");
      setRequestDate(toLocalDateTime());
      setRequestNotes("");
    },
    onError: (error: any) => {
      setCreateRequestError(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Unable to create the operation request. Please review the details and try again.",
      );
    },
  });

  const catalogMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: catalogCode.trim(),
        name: catalogName.trim(),
        description: catalogDescription.trim() || undefined,
        price: Number(catalogPrice),
        durationMinutes: Number(catalogDuration),
        isMaternityDelivery: catalogIsMaternityDelivery,
      };
      return editingCatalogId
        ? api.put(`/theater/catalog/${editingCatalogId}`, payload)
        : api.post("/theater/catalog", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["theater-procedure-catalog"] });
      setCatalogDialogOpen(false);
      resetCatalogForm();
      Swal.fire("Saved", "Procedure catalog updated", "success");
    },
    onError: (error) => {
      console.error("Unable to save procedure catalog item:", error);
      Swal.fire("Error", "Unable to save the procedure catalog item", "error");
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (!scheduleCase) return;
      await api.put(`/theater/${scheduleCase.id}`, {
        status: "SCHEDULED",
        procedureDate: new Date(scheduleDate).toISOString(),
        theaterId,
        surgeonId,
        anesthetistId,
      });
    },
    onSuccess: async () => {
      await refreshProcedures();
      setScheduleCase(null);
      Swal.fire("Scheduled", "Theater case scheduled and added to the visit invoice", "success");
    },
    onError: (error) => {
      console.error("Unable to schedule theater case:", error);
      Swal.fire("Unable to schedule", "Check the selected staff, room, and time slot, then try again", "error");
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/theater/${id}`, { status });
    },
    onSuccess: refreshProcedures,
    onError: (error) => {
      console.error("Unable to update theater case status:", error);
      Swal.fire("Error", "Unable to update the theater case", "error");
    },
  });

  const roomMutation = useMutation({
    mutationFn: async () => api.post("/theater/rooms", { name: roomName.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["theater-resources"] });
      setRoomDialogOpen(false);
      setRoomName("");
      Swal.fire("Saved", "Theater room added", "success");
    },
    onError: (error) => {
      console.error("Unable to add theater room:", error);
      Swal.fire("Error", "Unable to add the theater room", "error");
    },
  });

  function resetCatalogForm() {
    setEditingCatalogId("");
    setCatalogCode("");
    setCatalogName("");
    setCatalogDescription("");
    setCatalogPrice("");
    setCatalogDuration("60");
    setCatalogIsMaternityDelivery(false);
  }

  const editCatalogItem = (item: ProcedureCatalogItem) => {
    setEditingCatalogId(item.id);
    setCatalogCode(item.code);
    setCatalogName(item.name);
    setCatalogDescription(item.description || "");
    setCatalogPrice(String(item.price));
    setCatalogDuration(String(item.durationMinutes));
    setCatalogIsMaternityDelivery(item.isMaternityDelivery);
    setCatalogDialogOpen(true);
  };

  const openScheduleDialog = (procedure: SurgicalProcedure) => {
    setScheduleCase(procedure);
    setScheduleDate(toLocalDateTime(procedure.procedureDate));
    setTheaterId("");
    setSurgeonId("");
    setAnesthetistId("");
  };

  const submitSchedule = () => {
    if (!scheduleCase || !theaterId || !surgeonId || !anesthetistId || !scheduleDate) {
      Swal.fire("Required", "Choose a theater, surgeon, anesthetist, and schedule time", "warning");
      return;
    }
    scheduleMutation.mutate();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const renderCaseActions = (procedure: SurgicalProcedure) => canOperateTheater ? (
    <>
      {procedure.status === "REQUESTED" && (
        <Button
          size="small"
          variant="outlined"
          onClick={() => openScheduleDialog(procedure)}
        >
          Schedule
        </Button>
      )}
      {procedure.status === "SCHEDULED" && (
        <Button
          size="small"
          disabled={statusMutation.isPending}
          onClick={() => statusMutation.mutate({ id: procedure.id, status: "IN_PROGRESS" })}
        >
          Start
        </Button>
      )}
      {procedure.status === "IN_PROGRESS" && (
        <Button
          size="small"
          disabled={statusMutation.isPending}
          onClick={() => statusMutation.mutate({ id: procedure.id, status: "COMPLETED" })}
        >
          Complete
        </Button>
      )}
    </>
  ) : null;

  const caseSummary = [
    { label: "Awaiting schedule", status: "REQUESTED", color: "info" as const },
    { label: "Scheduled", status: "SCHEDULED", color: "primary" as const },
    { label: "In progress", status: "IN_PROGRESS", color: "warning" as const },
    { label: "Completed", status: "COMPLETED", color: "success" as const },
  ];

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, letterSpacing: "-0.025em" }}>
            Theater
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Review procedure requests, schedule cases, and track their completion.
          </Typography>
        </Box>
        {canOperateTheater && activeTab === 0 && (
          <Button
            variant="contained"
            onClick={() => {
              setCreateRequestError("");
              setCreateRequestOpen(true);
            }}
          >
            Create Operation
          </Button>
        )}
        {isAdministrator && activeTab === 1 && (
          <Button variant="contained" onClick={() => setRoomDialogOpen(true)}>
            Add Theater Room
          </Button>
        )}
        {isAdministrator && activeTab === 2 && (
          <Button
            variant="contained"
            onClick={() => {
              resetCatalogForm();
              setCatalogDialogOpen(true);
            }}
          >
            Add Procedure Price
          </Button>
        )}
      </Box>
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Unable to load theater cases. Please refresh the page and try again.
        </Alert>
      )}
      <Box
        aria-label="Theater case status summary"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
          gap: 1.25,
          mb: 2.5,
        }}
      >
        {caseSummary.map(({ label, status, color }) => {
          const count = procedures.filter((procedure) => procedure.status === status).length;
          return (
            <Paper
              key={status}
              variant="outlined"
              sx={{
                p: { xs: 1.5, sm: 1.75 },
                borderColor: "divider",
                borderLeft: 3,
                borderLeftColor: `${color}.main`,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1.15 }}>
                  {isLoading ? "—" : count}
                </Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>
      <Paper variant="outlined" sx={{ mb: 3, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Theater workflow sections"
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: "divider", px: { xs: 1, sm: 2 } }}
        >
          <Tab label={`Case queue (${isLoading ? "…" : procedures.length})`} />
          {isAdministrator && <Tab label="Rooms" />}
          {isAdministrator && <Tab label="Procedure catalog" />}
        </Tabs>
      {activeTab === 0 && (
      <>
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Procedure</TableCell>
                  <TableCell>Requested / Scheduled</TableCell>
                  <TableCell>Theater</TableCell>
                  <TableCell>Patient / Visit</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      Theater cases are unavailable.
                    </TableCell>
                  </TableRow>
                ) : procedures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      No theater cases or requests
                    </TableCell>
                  </TableRow>
                ) : procedures.map((procedure) => (
                  <TableRow
                    key={procedure.id}
                    hover
                    onClick={() => setSelectedProcedure(procedure)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{procedure.procedureName}</TableCell>
                    <TableCell>{new Date(procedure.procedureDate).toLocaleString()}</TableCell>
                    <TableCell>{procedure.theater?.name || "Pending assignment"}</TableCell>
                    <TableCell>{getCasePatient(procedure)}</TableCell>
                    <TableCell>
                      Surgeon: {procedure.surgeon
                        ? `${procedure.surgeon.firstName} ${procedure.surgeon.lastName}`
                        : "Unassigned"}
                      <br />
                      Anesthetist: {procedure.anesthetist
                        ? `${procedure.anesthetist.firstName} ${procedure.anesthetist.lastName}`
                        : "Unassigned"}
                    </TableCell>
                    <TableCell>{getCasePrice(procedure)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={procedure.status} color={getCaseStatusColor(procedure.status)} />
                    </TableCell>
                    <TableCell>{renderCaseActions(procedure)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Box
          sx={{
            display: { xs: "grid", md: "none" },
            gap: 1.5,
            p: 1.5,
          }}
        >
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : isError ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              Theater cases are unavailable.
            </Typography>
          ) : procedures.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              No theater cases or requests
            </Typography>
          ) : procedures.map((procedure) => (
          <Paper
            key={procedure.id}
            variant="outlined"
            sx={{ p: 1.5, cursor: "pointer" }}
            onClick={() => setSelectedProcedure(procedure)}
          >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                  {procedure.procedureName}
                </Typography>
                <Chip
                  size="small"
                  label={procedure.status}
                  color={getCaseStatusColor(procedure.status)}
                  sx={{ flexShrink: 0 }}
                />
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 1.25,
                }}
              >
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Typography variant="caption" color="text.secondary">Requested / Scheduled</Typography>
                  <Typography variant="body2">{new Date(procedure.procedureDate).toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Theater</Typography>
                  <Typography variant="body2">{procedure.theater?.name || "Pending assignment"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Price</Typography>
                  <Typography variant="body2">{getCasePrice(procedure)}</Typography>
                </Box>
                <Box sx={{ gridColumn: "1 / -1", minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary">Patient / Visit</Typography>
                  <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                    {getCasePatient(procedure)}
                  </Typography>
                </Box>
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Typography variant="caption" color="text.secondary">Team</Typography>
                  <Typography variant="body2">
                    Surgeon: {procedure.surgeon
                      ? `${procedure.surgeon.firstName} ${procedure.surgeon.lastName}`
                      : "Unassigned"}
                  </Typography>
                  <Typography variant="body2">
                    Anesthetist: {procedure.anesthetist
                      ? `${procedure.anesthetist.firstName} ${procedure.anesthetist.lastName}`
                      : "Unassigned"}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                {renderCaseActions(procedure)}
              </Box>
            </Paper>
          ))}
        </Box>
      </>
      )}

      {isAdministrator && activeTab === 1 && (
        <Box>
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Theater rooms</Typography>
            <Typography variant="body2" color="text.secondary">
              Rooms available for scheduled procedures.
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>Name</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {resourcesLoading ? (
                  <TableRow>
                    <TableCell align="center" sx={{ py: 4 }}>
                      <CircularProgress size={22} />
                    </TableCell>
                  </TableRow>
                ) : resourcesError ? (
                  <TableRow>
                    <TableCell align="center" sx={{ py: 4 }}>
                      Unable to load theater rooms.
                    </TableCell>
                  </TableRow>
                ) : resources?.theaters.map((theater) => (
                  <TableRow key={theater.id}><TableCell>{theater.name}</TableCell></TableRow>
                ))}
                {!resourcesLoading && !resourcesError && !resources?.theaters.length && (
                  <TableRow>
                    <TableCell align="center" sx={{ py: 4 }}>
                      No available theater rooms configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {isAdministrator && activeTab === 2 && (
        <Box>
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Procedure catalog</Typography>
            <Typography variant="body2" color="text.secondary">
              Procedure pricing and expected durations used when scheduling cases.
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small" sx={{ minWidth: 680 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Procedure</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Maternity delivery</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {catalogLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={22} />
                    </TableCell>
                  </TableRow>
                ) : catalogError ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      Unable to load the procedure catalog.
                    </TableCell>
                  </TableRow>
                ) : catalog.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.durationMinutes} min</TableCell>
                    <TableCell>{item.isMaternityDelivery ? "Yes" : "No"}</TableCell>
                    <TableCell>{Number(item.price).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => editCatalogItem(item)}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!catalogLoading && !catalogError && catalog.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      No active procedures configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      </Paper>

      <Drawer
        anchor="right"
        open={createRequestOpen}
        onClose={() => {
          if (!createRequestMutation.isPending) {
            setCreateRequestOpen(false);
            setCreateRequestError("");
          }
        }}
        PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, maxWidth: "100vw", p: 3, boxSizing: "border-box" } }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>Create operation</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Create a procedure request for an existing patient visit.
        </Typography>
        {createRequestError && <Alert severity="error" sx={{ mb: 2 }}>{createRequestError}</Alert>}
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            createRequestMutation.mutate();
          }}
          sx={{ display: "grid", gap: 2 }}
        >
          <TextField
            fullWidth
            required
            select
            label="Patient"
            value={requestPatientId}
            onChange={(event) => {
              setRequestPatientId(event.target.value);
              setRequestVisitId("");
            }}
            disabled={patientsLoading}
          >
            {patients.map((patient: any) => (
              <MenuItem key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName} · {patient.patientNumber}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            required
            select
            label="Patient visit"
            value={requestVisitId}
            onChange={(event) => setRequestVisitId(event.target.value)}
            disabled={!requestPatientId || visitsLoading}
          >
            {requestVisits.map((visit: any) => (
              <MenuItem key={visit.id} value={visit.id}>
                {new Date(visit.visitDate).toLocaleDateString()} · {visit.visitType} · {visit.status}
              </MenuItem>
            ))}
          </TextField>
          {!visitsLoading && requestPatientId && requestVisits.length === 0 && (
            <Alert severity="info">No visits are available for this patient.</Alert>
          )}
          <TextField
            fullWidth
            required
            select
            label="Procedure"
            value={requestCatalogId}
            onChange={(event) => setRequestCatalogId(event.target.value)}
            disabled={catalogLoading || catalogError}
          >
            {catalog.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name} · {Number(item.price).toLocaleString()}
              </MenuItem>
            ))}
          </TextField>
          {catalogError && <Alert severity="error">Procedure catalog could not be loaded.</Alert>}
          <TextField
            fullWidth
            required
            label="Requested date and time"
            type="datetime-local"
            value={requestDate}
            onChange={(event) => setRequestDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Clinical notes (optional)"
            value={requestNotes}
            onChange={(event) => setRequestNotes(event.target.value)}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
            <Button onClick={() => setCreateRequestOpen(false)} disabled={createRequestMutation.isPending}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                createRequestMutation.isPending ||
                patientsLoading ||
                visitsLoading ||
                catalogLoading ||
                !requestVisitId ||
                !requestCatalogId ||
                !requestDate
              }
            >
              {createRequestMutation.isPending ? <CircularProgress size={21} color="inherit" /> : "Create request"}
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        variant={smallViewport ? "temporary" : "persistent"}
        open={Boolean(selectedProcedure)}
        onClose={() => setSelectedProcedure(null)}
        PaperProps={{
          sx: {
            width: { xs: "100vw", sm: 480 },
            maxWidth: "100vw",
            p: 3,
            boxSizing: "border-box",
            position: smallViewport ? "fixed" : "relative",
            height: "100%",
          },
        }}
      >
        {selectedProcedure && (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", mb: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>{selectedProcedure.procedureName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {getCasePatient(selectedProcedure)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip label={selectedProcedure.status} color={getCaseStatusColor(selectedProcedure.status)} size="small" />
                <IconButton
                  aria-label="Close operation details"
                  onClick={() => setSelectedProcedure(null)}
                  size="small"
                >
                  <Close />
                </IconButton>
              </Box>
            </Box>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Operation details</Typography>
              <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Patient</Typography>
                  <Typography variant="body2">{getCasePatient(selectedProcedure)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Procedure</Typography>
                  <Typography variant="body2">{selectedProcedure.procedureName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Scheduled</Typography>
                  <Typography variant="body2">{new Date(selectedProcedure.procedureDate).toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Theater</Typography>
                  <Typography variant="body2">{selectedProcedure.theater?.name || "Not assigned"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Surgeon</Typography>
                  <Typography variant="body2">
                    {selectedProcedure.surgeon
                      ? `${selectedProcedure.surgeon.firstName} ${selectedProcedure.surgeon.lastName}`
                      : "Not assigned"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Anesthetist</Typography>
                  <Typography variant="body2">
                    {selectedProcedure.anesthetist
                      ? `${selectedProcedure.anesthetist.firstName} ${selectedProcedure.anesthetist.lastName}`
                      : "Not assigned"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Price</Typography>
                  <Typography variant="body2">{getCasePrice(selectedProcedure)}</Typography>
                </Box>
              </Box>
              {selectedProcedure.notes && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Clinical notes</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{selectedProcedure.notes}</Typography>
                </Box>
              )}
            </Paper>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {renderCaseActions(selectedProcedure)}
              {canOperateTheater && (
                <>
                  <Button variant="outlined" onClick={() => setPrescriptionOpen(true)}>Prescribe medication</Button>
                  <Button variant="outlined" onClick={() => setLabDrawerOpen(true)}>Order lab tests</Button>
                </>
              )}
            </Box>
          </Box>
        )}
      </Drawer>

      {selectedProcedure?.visit?.patient && (
        <>
          <PrescribeMedicationDrawer
            open={prescriptionOpen}
            onClose={() => setPrescriptionOpen(false)}
            visitId={selectedProcedure.visitId}
            patientName={`${selectedProcedure.visit.patient.firstName} ${selectedProcedure.visit.patient.lastName}`}
          />
          <OrderLabTestDrawer
            open={labDrawerOpen}
            onClose={() => setLabDrawerOpen(false)}
            visitId={selectedProcedure.visitId}
            patientId={selectedProcedure.visit.patient.id}
            patientName={`${selectedProcedure.visit.patient.firstName} ${selectedProcedure.visit.patient.lastName}`}
          />
        </>
      )}

      <Dialog open={catalogDialogOpen} onClose={() => setCatalogDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingCatalogId ? "Edit Procedure Price" : "Add Procedure Price"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <TextField label="Code" value={catalogCode} onChange={(event) => setCatalogCode(event.target.value)} />
          <TextField label="Name" value={catalogName} onChange={(event) => setCatalogName(event.target.value)} />
          <TextField
            label="Description"
            multiline
            value={catalogDescription}
            onChange={(event) => setCatalogDescription(event.target.value)}
          />
          <TextField
            label="Price"
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            value={catalogPrice}
            onChange={(event) => setCatalogPrice(event.target.value)}
          />
          <TextField
            label="Expected duration (minutes)"
            type="number"
            inputProps={{ min: 15, max: 1440, step: 15 }}
            value={catalogDuration}
            onChange={(event) => setCatalogDuration(event.target.value)}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={catalogIsMaternityDelivery}
                onChange={(event) => setCatalogIsMaternityDelivery(event.target.checked)}
              />
            }
            label="Maternity delivery procedure"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatalogDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!catalogCode.trim() || !catalogName.trim() || Number(catalogPrice) <= 0 || catalogMutation.isPending}
            onClick={() => catalogMutation.mutate()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={roomDialogOpen} onClose={() => setRoomDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Theater Room</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Theater name"
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!roomName.trim() || roomMutation.isPending}
            onClick={() => roomMutation.mutate()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="right"
        open={Boolean(scheduleCase)}
        onClose={() => setScheduleCase(null)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, maxWidth: "100vw", p: 3, boxSizing: "border-box" } }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Schedule Theater Case</Typography>
        <Box sx={{ display: "grid", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Scheduling reserves the room and adds the catalog price to the linked visit invoice.
          </Typography>
          <TextField
            label="Scheduled date and time"
            type="datetime-local"
            value={scheduleDate}
            onChange={(event) => setScheduleDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth>
            <InputLabel id="theater-select-label">Theater</InputLabel>
            <Select
              labelId="theater-select-label"
              label="Theater"
              value={theaterId}
              onChange={(event) => setTheaterId(event.target.value)}
            >
              {resources?.theaters.map((theater) => (
                <MenuItem key={theater.id} value={theater.id}>{theater.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="surgeon-select-label">Surgeon</InputLabel>
            <Select
              labelId="surgeon-select-label"
              label="Surgeon"
              value={surgeonId}
              onChange={(event) => setSurgeonId(event.target.value)}
            >
              {resources?.surgeons.map((staff) => (
                <MenuItem key={staff.id} value={staff.id}>{staff.firstName} {staff.lastName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="anesthetist-select-label">Anesthetist</InputLabel>
            <Select
              labelId="anesthetist-select-label"
              label="Anesthetist"
              value={anesthetistId}
              onChange={(event) => setAnesthetistId(event.target.value)}
            >
              {resources?.anesthetists.map((staff) => (
                <MenuItem key={staff.id} value={staff.id}>{staff.firstName} {staff.lastName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {!resources?.anesthetists.length && (
            <Alert
              severity="warning"
              action={
                isAdministrator ? (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setScheduleCase(null);
                      navigate("/users");
                    }}
                  >
                    Manage users
                  </Button>
                ) : undefined
              }
            >
              No active anesthetist account is available. Ask an administrator
              to create an active user with the Anesthetist role before
              scheduling.
            </Alert>
          )}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
          <Button onClick={() => setScheduleCase(null)}>Cancel</Button>
          <Button variant="contained" disabled={scheduleMutation.isPending} onClick={submitSchedule}>
            Schedule
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default TheaterDashboardPage;