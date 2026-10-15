import { Fragment, useMemo, useState } from "react";
import {
  Add,
  Apartment,
  Bed,
  ExpandLess,
  ExpandMore,
  Hotel,
  Refresh,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Stack,
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
import axios from "axios";
import api from "../../services/api";

type BedStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";

interface ManagedBed {
  id: string;
  bedNumber: string;
  status: BedStatus;
  isOccupied: boolean;
  notes?: string | null;
}

interface ManagedWard {
  id: string;
  name: string;
  department: string;
  description?: string | null;
  isActive: boolean;
  totalBeds: number;
  beds: ManagedBed[];
}

interface WardForm {
  name: string;
  department: string;
  description: string;
  bedCount: string;
}

const emptyWardForm: WardForm = {
  name: "",
  department: "",
  description: "",
  bedCount: "10",
};

const statusStyles: Record<BedStatus, { label: string; color: "success" | "error" | "warning" | "info" }> = {
  AVAILABLE: { label: "Available", color: "success" },
  OCCUPIED: { label: "Occupied", color: "error" },
  MAINTENANCE: { label: "Maintenance", color: "warning" },
  RESERVED: { label: "Reserved", color: "info" },
};

const errorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message as string | undefined;
    if (status === 409) {
      return message || "That ward or bed number already exists. No changes were saved.";
    }
    if (status === 400) {
      return message || "Check the information entered and try again.";
    }
    if (status === 401 || status === 403) {
      return "Your administrator session is no longer authorized for this action.";
    }
    return message || "The request could not be completed. Please try again.";
  }
  return "Something went wrong. Please try again.";
};

const getWardCounts = (ward: ManagedWard) => ({
  available: ward.beds.filter((bed) => bed.status === "AVAILABLE" && !bed.isOccupied).length,
  occupied: ward.beds.filter((bed) => bed.status === "OCCUPIED" || bed.isOccupied).length,
  maintenance: ward.beds.filter((bed) => bed.status === "MAINTENANCE").length,
  reserved: ward.beds.filter((bed) => bed.status === "RESERVED").length,
});

const getWardAttention = (ward: ManagedWard) => {
  const counts = getWardCounts(ward);
  return {
    lowAvailability: ward.isActive && ward.totalBeds > 0 && counts.available / ward.totalBeds <= 0.2,
    counts,
  };
};

const WardManagementPage = () => {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<"create" | "add-beds" | null>(null);
  const [selectedWard, setSelectedWard] = useState<ManagedWard | null>(null);
  const [wardForm, setWardForm] = useState<WardForm>(emptyWardForm);
  const [bedCount, setBedCount] = useState("1");
  const [expandedWardIds, setExpandedWardIds] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState("");

  const wardsQuery = useQuery({
    queryKey: ["ward-management"],
    queryFn: async () => {
      const response = await api.get("/visits/wards/manage");
      if (!Array.isArray(response.data.wards)) {
        throw new Error("The ward list response was invalid.");
      }
      return response.data.wards as ManagedWard[];
    },
  });
  const wards = wardsQuery.data ?? [];
  const activeWards = wards.filter((ward) => ward.isActive);

  const refreshWardData = async () => {
    await queryClient.invalidateQueries({ queryKey: ["ward-management"] });
    try {
      await queryClient.fetchQuery({
        queryKey: ["admission-available-wards"],
        queryFn: async () => {
          const response = await api.get("/visits/wards/available");
          if (!Array.isArray(response.data.wards)) {
            throw new Error("The available ward list response was invalid");
          }
          return response.data.wards;
        },
      });
    } catch {
      await queryClient.invalidateQueries({ queryKey: ["admission-available-wards"] });
    }
  };

  const createWardMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/visits/wards/manage", {
        name: wardForm.name.trim(),
        department: wardForm.department.trim(),
        description: wardForm.description.trim() || undefined,
        bedCount: Number(wardForm.bedCount),
      });
      return response.data.ward as ManagedWard;
    },
    onSuccess: async (ward) => {
      await refreshWardData();
      setDialog(null);
      setWardForm(emptyWardForm);
      setExpandedWardIds((current) => new Set(current).add(ward.id));
      setSuccessMessage(`${ward.name} and ${ward.beds.length} beds created.`);
    },
  });

  const addBedsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWard) throw new Error("Select a ward first.");
      const response = await api.post(`/visits/wards/${selectedWard.id}/beds`, {
        bedCount: Number(bedCount),
      });
      return response.data.ward as ManagedWard;
    },
    onSuccess: async (ward) => {
      await refreshWardData();
      setDialog(null);
      setSelectedWard(null);
      setBedCount("1");
      setExpandedWardIds((current) => new Set(current).add(ward.id));
      setSuccessMessage(`${Number(bedCount)} beds added to ${ward.name}.`);
    },
  });

  const totalCapacity = useMemo(
    () => wards.reduce((total, ward) => total + ward.totalBeds, 0),
    [wards],
  );
  const availableCapacity = useMemo(
    () => activeWards.reduce((total, ward) => total + getWardCounts(ward).available, 0),
    [activeWards],
  );
  const occupiedCapacity = useMemo(
    () => activeWards.reduce((total, ward) => total + getWardCounts(ward).occupied, 0),
    [activeWards],
  );

  const toggleExpanded = (wardId: string) => {
    setExpandedWardIds((current) => {
      const next = new Set(current);
      if (next.has(wardId)) next.delete(wardId);
      else next.add(wardId);
      return next;
    });
  };

  const openAddBeds = (ward: ManagedWard) => {
    setSelectedWard(ward);
    setBedCount("1");
    addBedsMutation.reset();
    setDialog("add-beds");
  };

  const closeDialog = () => {
    if (createWardMutation.isPending || addBedsMutation.isPending) return;
    setDialog(null);
    createWardMutation.reset();
    addBedsMutation.reset();
  };

  const wardFormIsValid =
    wardForm.name.trim().length > 0 &&
    wardForm.department.trim().length > 0 &&
    Number.isInteger(Number(wardForm.bedCount)) &&
    Number(wardForm.bedCount) > 0 &&
    Number(wardForm.bedCount) <= 200;
  const bedFormIsValid =
    Number.isInteger(Number(bedCount)) &&
    Number(bedCount) > 0 &&
    Number(bedCount) <= 200;

  const renderBeds = (ward: ManagedWard) => (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 2.5 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 1.5 }}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            Bed inventory
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Bed availability is updated automatically when admissions change.
          </Typography>
        </Box>
      </Stack>
      {ward.beds.length === 0 ? (
        <Alert severity="info">No beds are configured for this ward yet.</Alert>
      ) : (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {ward.beds.map((bed) => {
            const status = bed.isOccupied ? "OCCUPIED" : bed.status;
            const display = statusStyles[status] ?? statusStyles.AVAILABLE;
            return (
              <Chip
                key={bed.id}
                icon={<Bed />}
                label={`${bed.bedNumber} · ${display.label}`}
                color={display.color}
                variant={status === "AVAILABLE" ? "outlined" : "filled"}
                size="small"
                title={bed.notes || undefined}
                sx={{ fontWeight: 600 }}
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3, xl: 4 }, maxWidth: 1600, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.5 }}>
            <Apartment color="primary" />
            <Typography variant="h4" fontWeight={750} letterSpacing="-0.035em">
              Wards &amp; Beds
            </Typography>
          </Stack>
          <Typography color="text.secondary">
            Manage inpatient capacity and keep admission options up to date.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={wardsQuery.isFetching ? <CircularProgress size={16} /> : <Refresh />}
            onClick={() => void wardsQuery.refetch()}
            disabled={wardsQuery.isFetching}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              createWardMutation.reset();
              setDialog("create");
            }}
          >
            Create ward
          </Button>
        </Stack>
      </Stack>

      {wardsQuery.isError && (
        <Alert
          severity={axios.isAxiosError(wardsQuery.error) && wardsQuery.error.response?.status === 403 ? "warning" : "error"}
          sx={{ mb: 2.5 }}
          action={
            <Button color="inherit" size="small" onClick={() => void wardsQuery.refetch()}>
              Retry
            </Button>
          }
        >
          {axios.isAxiosError(wardsQuery.error) && wardsQuery.error.response?.status === 403
            ? "You need administrator access to view ward and bed management."
            : errorMessage(wardsQuery.error)}
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: "Active wards", value: activeWards.length, icon: <Apartment />, accent: "#0E7490" },
          { label: "Active beds available", value: availableCapacity, icon: <Bed />, accent: "#12836A" },
          { label: "Active beds occupied", value: occupiedCapacity, icon: <Hotel />, accent: "#B45338" },
        ].map((metric) => (
          <Paper
            key={metric.label}
            variant="outlined"
            sx={{
              flex: 1,
              px: 2.25,
              py: 1.75,
              display: "flex",
              alignItems: "center",
              gap: 1.75,
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                color: metric.accent,
                bgcolor: `${metric.accent}12`,
                "& svg": { fontSize: 21 },
              }}
            >
              {metric.icon}
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
              <Typography variant="h5" fontWeight={750} lineHeight={1.2}>
                {wardsQuery.isLoading ? "—" : metric.value}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={0.5}
          sx={{ px: { xs: 2, sm: 2.5 }, py: 2, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>Ward inventory</Typography>
            <Typography variant="body2" color="text.secondary">
              {wardsQuery.isLoading
                ? "Loading ward data…"
                : `${wards.length} ${wards.length === 1 ? "ward" : "wards"} · ${totalCapacity} beds across all wards`}
            </Typography>
          </Box>
        </Stack>

        {wardsQuery.isLoading ? (
          <Box sx={{ minHeight: 240, display: "grid", placeItems: "center" }}>
            <Stack alignItems="center" spacing={1.5}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">Loading wards and beds…</Typography>
            </Stack>
          </Box>
        ) : !wardsQuery.isError && wards.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: { xs: 6, sm: 8 }, px: 3, textAlign: "center" }}>
            <Apartment sx={{ color: "text.disabled", fontSize: 42 }} />
            <Typography variant="h6" fontWeight={700}>No wards yet</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 410 }}>
              Create a ward and its first beds together. They will be ready to select in patient admissions.
            </Typography>
            <Button variant="contained" startIcon={<Add />} sx={{ mt: 1 }} onClick={() => setDialog("create")}>
              Create your first ward
            </Button>
          </Stack>
        ) : wards.length > 0 ? (
          <>
          <Stack spacing={1} sx={{ display: { xs: "flex", xl: "none" }, p: 1.5 }}>
            {wards.map((ward) => {
              const { counts, lowAvailability } = getWardAttention(ward);
              const isExpanded = expandedWardIds.has(ward.id);
              return (
                <Paper key={ward.id} variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
                  <Stack spacing={1.5} sx={{ p: 1.5 }}>
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700}>{ward.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{ward.department}</Typography>
                        {(lowAvailability || counts.maintenance > 0) && (
                          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.75 }}>
                            {lowAvailability && (
                              <Chip
                                size="small"
                                color="warning"
                                variant="outlined"
                                label={counts.available === 0 ? "No beds available" : "Low availability"}
                              />
                            )}
                            {counts.maintenance > 0 && (
                              <Chip size="small" color="warning" variant="outlined" label={`${counts.maintenance} in maintenance`} />
                            )}
                          </Stack>
                        )}
                        {ward.description && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            {ward.description}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={ward.isActive ? "Active" : "Inactive"}
                        size="small"
                        color={ward.isActive ? "success" : "default"}
                        variant={ward.isActive ? "outlined" : "filled"}
                      />
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" justifyContent="space-between" columnGap={2} rowGap={1}>
                      {[
                        { label: "Total", value: ward.totalBeds },
                        { label: "Available", value: counts.available, color: "success.dark" },
                        { label: "Occupied", value: counts.occupied },
                        { label: "Maintenance", value: counts.maintenance, color: counts.maintenance ? "warning.dark" : undefined },
                        { label: "Reserved", value: counts.reserved, color: counts.reserved ? "info.dark" : undefined },
                      ].map((item) => (
                        <Box key={item.label}>
                          <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                          <Typography fontWeight={700} color={item.color}>{item.value}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => openAddBeds(ward)}>
                        Add beds
                      </Button>
                      <Button
                        size="small"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Hide" : "View"} beds for ${ward.name}`}
                        onClick={() => toggleExpanded(ward.id)}
                        endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                      >
                        {isExpanded ? "Hide beds" : "View beds"}
                      </Button>
                    </Stack>
                  </Stack>
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    {renderBeds(ward)}
                  </Collapse>
                </Paper>
              );
            })}
          </Stack>
          <TableContainer sx={{ display: { xs: "none", xl: "block" } }}>
            <Table aria-label="Ward capacity">
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell sx={{ pl: { xs: 1.5, sm: 2.5 }, fontWeight: 700 }}>Ward</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Available</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Occupied</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Maintenance</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Reserved</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ pr: { xs: 1.5, sm: 2.5 }, fontWeight: 700 }}>Beds</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {wards.map((ward) => {
                  const { counts, lowAvailability } = getWardAttention(ward);
                  const isExpanded = expandedWardIds.has(ward.id);
                  return (
                    <Fragment key={ward.id}>
                      <TableRow
                        hover
                        sx={{ "& > *": { borderBottom: isExpanded ? 0 : undefined } }}
                      >
                        <TableCell sx={{ pl: { xs: 1.5, sm: 2.5 }, minWidth: 170 }}>
                          <Typography fontWeight={700}>{ward.name}</Typography>
                          {(lowAvailability || counts.maintenance > 0) && (
                            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                              {lowAvailability && (
                                <Chip
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  label={counts.available === 0 ? "No beds available" : "Low availability"}
                                />
                              )}
                              {counts.maintenance > 0 && (
                                <Chip size="small" color="warning" variant="outlined" label={`${counts.maintenance} maintenance`} />
                              )}
                            </Stack>
                          )}
                          {ward.description && (
                            <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 230 }}>
                              {ward.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{ward.department}</TableCell>
                        <TableCell align="right">{ward.totalBeds}</TableCell>
                        <TableCell align="right">
                          <Typography color="success.dark" fontWeight={700}>{counts.available}</Typography>
                        </TableCell>
                        <TableCell align="right">{counts.occupied}</TableCell>
                        <TableCell align="right">
                          <Typography color={counts.maintenance ? "warning.dark" : "text.primary"} fontWeight={counts.maintenance ? 700 : 400}>
                            {counts.maintenance}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography color={counts.reserved ? "info.dark" : "text.primary"} fontWeight={counts.reserved ? 700 : 400}>
                            {counts.reserved}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ward.isActive ? "Active" : "Inactive"}
                            size="small"
                            color={ward.isActive ? "success" : "default"}
                            variant={ward.isActive ? "outlined" : "filled"}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ pr: { xs: 1.5, sm: 2.5 }, whiteSpace: "nowrap" }}>
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Button size="small" startIcon={<Add />} onClick={() => openAddBeds(ward)}>
                              Add beds
                            </Button>
                            <Button
                              size="small"
                              aria-expanded={isExpanded}
                              aria-label={`${isExpanded ? "Hide" : "View"} beds for ${ward.name}`}
                              onClick={() => toggleExpanded(ward.id)}
                              endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                            >
                              {isExpanded ? "Hide beds" : "View beds"}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={9} sx={{ p: 0, borderBottom: isExpanded ? undefined : "none" }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            {renderBeds(ward)}
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          </>
        ) : null}
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, textAlign: "right" }}>
        {wardsQuery.isSuccess
          ? `${occupiedCapacity} occupied · ${availableCapacity} available for admission in active wards`
          : ""}
      </Typography>

      <Dialog open={dialog === "create"} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 0.5 }}>Create a ward</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            New beds are created atomically with the ward and numbered automatically.
          </Typography>
          <Stack spacing={2}>
            <TextField
              autoFocus
              required
              fullWidth
              label="Ward name"
              placeholder="e.g. General Medical Ward"
              value={wardForm.name}
              onChange={(event) => setWardForm((current) => ({ ...current, name: event.target.value }))}
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              required
              fullWidth
              label="Department"
              placeholder="e.g. Internal Medicine"
              value={wardForm.department}
              onChange={(event) => setWardForm((current) => ({ ...current, department: event.target.value }))}
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Description"
              placeholder="Optional details about this ward"
              value={wardForm.description}
              onChange={(event) => setWardForm((current) => ({ ...current, description: event.target.value }))}
              inputProps={{ maxLength: 500 }}
              helperText={`${wardForm.description.length}/500`}
            />
            <TextField
              required
              type="number"
              label="Initial bed count"
              value={wardForm.bedCount}
              onChange={(event) => setWardForm((current) => ({ ...current, bedCount: event.target.value }))}
              inputProps={{ min: 1, max: 200, step: 1 }}
              helperText={`Creates Bed 01 through Bed ${String(Number(wardForm.bedCount) || 0).padStart(2, "0")}`}
              error={Boolean(wardForm.bedCount) && !wardFormIsValid}
            />
            {createWardMutation.isError && (
              <Alert severity="error">{errorMessage(createWardMutation.error)}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDialog} disabled={createWardMutation.isPending}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createWardMutation.mutate()}
            disabled={!wardFormIsValid || createWardMutation.isPending}
            startIcon={createWardMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Add />}
          >
            Create ward &amp; beds
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === "add-beds"} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>Add beds</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add new, available beds to <strong>{selectedWard?.name}</strong>. Existing bed numbers and statuses will not be changed.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            required
            type="number"
            label="Number of beds"
            value={bedCount}
            onChange={(event) => setBedCount(event.target.value)}
            inputProps={{ min: 1, max: 200, step: 1 }}
            helperText={`Numbered sequentially after the current highest bed number (up to 200 per batch).`}
            error={Boolean(bedCount) && !bedFormIsValid}
          />
          {addBedsMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>{errorMessage(addBedsMutation.error)}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDialog} disabled={addBedsMutation.isPending}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => addBedsMutation.mutate()}
            disabled={!bedFormIsValid || addBedsMutation.isPending}
            startIcon={addBedsMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Add />}
          >
            Add {Number(bedCount) || ""} beds
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={5000}
        onClose={() => setSuccessMessage("")}
        message={successMessage}
      />
    </Box>
  );
};

export default WardManagementPage;
