import { useState } from "react";
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
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import api from "../../services/api";
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
  visit: {
    patient: { firstName: string; lastName: string; patientNumber: string };
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

const TheaterPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdministrator = user?.role.name === "ADMINISTRATOR";
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

  const { data: procedures = [], isLoading, isError } = useQuery({
    queryKey: ["theater-procedures"],
    queryFn: async () => {
      const response = await api.get("/theater");
      return response.data as SurgicalProcedure[];
    },
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ["theater-procedure-catalog"],
    queryFn: async () => {
      const response = await api.get("/theater/catalog");
      return response.data as ProcedureCatalogItem[];
    },
  });

  const { data: resources } = useQuery({
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

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4">Theater</Typography>
          <Typography color="text.secondary">
            Review procedure requests, schedule cases, and track their completion.
          </Typography>
        </Box>
        {isAdministrator && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={() => setRoomDialogOpen(true)}>
              Add Theater Room
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                resetCatalogForm();
                setCatalogDialogOpen(true);
              }}
            >
              Add Procedure Price
            </Button>
          </Box>
        )}
      </Box>
      {isError && <Alert severity="error" sx={{ mb: 2 }}>Unable to load theater procedures.</Alert>}
      <TableContainer component={Paper}>
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
                <TableCell colSpan={8} align="center"><CircularProgress size={24} /></TableCell>
              </TableRow>
            ) : procedures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No theater cases or requests</TableCell>
              </TableRow>
            ) : procedures.map((procedure) => (
              <TableRow key={procedure.id}>
                <TableCell>{procedure.procedureName}</TableCell>
                <TableCell>{new Date(procedure.procedureDate).toLocaleString()}</TableCell>
                <TableCell>{procedure.theater?.name || "Pending assignment"}</TableCell>
                <TableCell>
                  {procedure.visit?.patient
                    ? `${procedure.visit.patient.firstName} ${procedure.visit.patient.lastName} (${procedure.visit.patient.patientNumber})`
                    : procedure.visitId}
                </TableCell>
                <TableCell>
                  Surgeon: {procedure.surgeon
                    ? `${procedure.surgeon.firstName} ${procedure.surgeon.lastName}`
                    : "Unassigned"}
                  <br />
                  Anesthetist: {procedure.anesthetist
                    ? `${procedure.anesthetist.firstName} ${procedure.anesthetist.lastName}`
                    : "Unassigned"}
                </TableCell>
                <TableCell>
                  {procedure.procedureFee != null
                    ? Number(procedure.procedureFee).toLocaleString()
                    : procedure.catalog
                      ? Number(procedure.catalog.price).toLocaleString()
                      : "Not priced"}
                </TableCell>
                <TableCell><Chip size="small" label={procedure.status} /></TableCell>
                <TableCell>
                  {procedure.status === "REQUESTED" && (
                    <Button size="small" onClick={() => openScheduleDialog(procedure)}>
                      Schedule
                    </Button>
                  )}
                  {procedure.status === "SCHEDULED" && (
                    <Button
                      size="small"
                      onClick={() => statusMutation.mutate({ id: procedure.id, status: "IN_PROGRESS" })}
                    >
                      Start
                    </Button>
                  )}
                  {procedure.status === "IN_PROGRESS" && (
                    <Button
                      size="small"
                      onClick={() => statusMutation.mutate({ id: procedure.id, status: "COMPLETED" })}
                    >
                      Complete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {isAdministrator && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Theaters</Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>Name</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {resources?.theaters.map((theater) => (
                  <TableRow key={theater.id}><TableCell>{theater.name}</TableCell></TableRow>
                ))}
                {!resources?.theaters.length && (
                  <TableRow><TableCell align="center">No available theater rooms configured</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="h6" sx={{ mb: 1 }}>Procedure Price Catalog</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
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
                {catalog.map((item) => (
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
                {catalog.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center">No active procedures configured</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
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

      <Dialog open={Boolean(scheduleCase)} onClose={() => setScheduleCase(null)} fullWidth maxWidth="sm">
        <DialogTitle>Schedule Theater Case</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
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
            <Alert severity="warning">
              No active anesthetist account is available. An administrator must create or assign the ANESTHETIST role before scheduling.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleCase(null)}>Cancel</Button>
          <Button variant="contained" disabled={scheduleMutation.isPending} onClick={submitSchedule}>
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TheaterPage;
