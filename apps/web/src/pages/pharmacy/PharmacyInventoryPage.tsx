import React from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Avatar,
  Alert,
  MenuItem,
} from "@mui/material";
import {
  Add,
  Edit,
  Inventory,
  Warning,
  CheckCircle,
  Event,
  LocalPharmacy,
  Visibility,
  Refresh,
} from "@mui/icons-material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../services/api";

interface MedicationInventory {
  id: string;
  name: string;
  genericName: string;
  category: string;
  sku: string;
  manufacturer: string;
  batchNumber: string;
  quantity: number;
  unit: string; // "tablets", "ml", "capsules", "injections"
  minStockLevel: number;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate: string;
  location: string; // storage location in pharmacy
  lastRestocked: string;
}

const PharmacyInventoryPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] =
    React.useState<MedicationInventory | null>(null);
  const [filter, setFilter] = React.useState<string>("all");

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["pharmacy-inventory"],
    queryFn: async () => {
      const res = await api.get("/pharmacy/inventory");
      return res.data.medications as MedicationInventory[];
    },
  });

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setOpen(true);
  };

  const handleOpenEdit = (item: MedicationInventory) => {
    setSelectedItem(item);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedItem(null);
  };

  // Calculate inventory statistics
  const totalItems = inventory?.length || 0;
  const totalStockValue =
    inventory?.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice,
      0,
    ) || 0;

  const expiringWithin30Days =
    inventory?.filter((item) => {
      const expiry = new Date(item.expiryDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return (
        expiry <= thirtyDaysFromNow && new Date(item.expiryDate) > new Date()
      );
    }).length || 0;

  const lowStockItems =
    inventory?.filter((item) => item.quantity <= item.minStockLevel).length ||
    0;
  const outOfStock =
    inventory?.filter((item) => item.quantity === 0).length || 0;
  const alreadyExpired =
    inventory?.filter((item) => new Date(item.expiryDate) < new Date())
      .length || 0;

  // Filter inventory based on status
  const filteredInventory = React.useMemo(() => {
    if (!inventory) return [];
    switch (filter) {
      case "low-stock":
        return inventory.filter((item) => item.quantity <= item.minStockLevel);
      case "expiring-soon":
        return inventory.filter((item) => {
          const expiry = new Date(item.expiryDate);
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          return (
            expiry <= thirtyDaysFromNow &&
            new Date(item.expiryDate) > new Date()
          );
        });
      case "expired":
        return inventory.filter(
          (item) => new Date(item.expiryDate) < new Date(),
        );
      default:
        return inventory;
    }
  }, [inventory, filter]);

  const getStockStatusColor = (item: MedicationInventory) => {
    if (item.quantity === 0) return "error";
    if (item.quantity <= item.minStockLevel) return "warning";
    return "success";
  };

  const getStockStatusLabel = (item: MedicationInventory) => {
    if (item.quantity === 0) return "Out of Stock";
    if (item.quantity <= item.minStockLevel) return "Low Stock";
    return "In Stock";
  };

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "Expired", color: "error" };
    if (diffDays <= 30) return { label: `${diffDays}d left`, color: "warning" };
    if (diffDays <= 90) return { label: `${diffDays}d left`, color: "info" };
    return { label: `${diffDays}d left`, color: "success" };
  };

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
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
              Pharmacy Inventory Management
            </Typography>
            <Typography color="text.secondary">
              Track medication stock levels, expiry dates, and inventory value
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["pharmacy-inventory"],
                })
              }
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenAdd}
            >
              Add Medication
            </Button>
          </Box>
        </Box>

        {/* Alerts Banner */}
        {(lowStockItems > 0 ||
          expiringWithin30Days > 0 ||
          alreadyExpired > 0) && (
          <Box sx={{ mb: 3 }}>
            {lowStockItems > 0 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                ⚠️ {lowStockItems} items are below minimum stock levels and need
                restocking.
              </Alert>
            )}
            {expiringWithin30Days > 0 && (
              <Alert severity="info" sx={{ mb: 1 }}>
                ℹ️ {expiringWithin30Days} medications will expire within the
                next 30 days.
              </Alert>
            )}
            {alreadyExpired > 0 && (
              <Alert severity="error" sx={{ mb: 1 }}>
                ❌ {alreadyExpired} medications have expired and should be
                removed from inventory.
              </Alert>
            )}
          </Box>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "#1976d2", width: 50, height: 50 }}>
                  <Inventory />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {totalItems}
                  </Typography>
                  <Typography color="text.secondary">Total SKUs</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "#2e7d32", width: 50, height: 50 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    ${totalStockValue.toLocaleString()}
                  </Typography>
                  <Typography color="text.secondary">Stock Value</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "#ed6c02", width: 50, height: 50 }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {lowStockItems}
                  </Typography>
                  <Typography color="text.secondary">Low Stock</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "#9c27b0", width: 50, height: 50 }}>
                  <Event />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {expiringWithin30Days}
                  </Typography>
                  <Typography color="text.secondary">Expiring Soon</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Filter Buttons */}
        <Box sx={{ mb: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={`All Items (${totalItems})`}
            onClick={() => setFilter("all")}
            color={filter === "all" ? "primary" : "default"}
            variant={filter === "all" ? "filled" : "outlined"}
          />
          <Chip
            label={`Low Stock (${lowStockItems})`}
            onClick={() => setFilter("low-stock")}
            color={filter === "low-stock" ? "warning" : "default"}
            variant={filter === "low-stock" ? "filled" : "outlined"}
          />
          <Chip
            label={`Expiring Soon (${expiringWithin30Days})`}
            onClick={() => setFilter("expiring-soon")}
            color={filter === "expiring-soon" ? "info" : "default"}
            variant={filter === "expiring-soon" ? "filled" : "outlined"}
          />
          <Chip
            label={`Expired (${alreadyExpired})`}
            onClick={() => setFilter("expired")}
            color={filter === "expired" ? "error" : "default"}
            variant={filter === "expired" ? "filled" : "outlined"}
          />
          <Chip
            label={`Out of Stock (${outOfStock})`}
            onClick={() => {}}
            variant="outlined"
          />
        </Box>

        {/* Inventory Table */}
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
                      Medication
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>SKU/Batch</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Stock Level
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Expiry Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInventory?.map((item) => {
                    const expiryStatus = getExpiryStatus(item.expiryDate);
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Avatar
                              sx={{ bgcolor: "#4caf50", width: 40, height: 40 }}
                            >
                              <LocalPharmacy fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 500 }}>
                                {item.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {item.genericName} • {item.category}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {item.sku}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Batch: {item.batchNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>
                            <strong>{item.quantity}</strong> {item.unit}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Min: {item.minStockLevel} {item.unit}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>
                            ${item.sellingPrice.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Buy: ${item.purchasePrice.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>
                            {new Date(item.expiryDate).toLocaleDateString()}
                          </Typography>
                          <Chip
                            label={expiryStatus.label}
                            size="small"
                            color={expiryStatus.color as any}
                            sx={{ mt: 0.5 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.location}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Restocked:{" "}
                            {new Date(item.lastRestocked).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStockStatusLabel(item)}
                            color={getStockStatusColor(item) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Barcode Scan">
                            <IconButton size="small">
                              <Refresh />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Stock">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(item)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Add/Edit Medication Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedItem
              ? "Edit Medication Inventory"
              : "Add New Medication to Inventory"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
              {selectedItem
                ? "Update stock levels, pricing, or storage information for this medication."
                : "Add a new medication to your pharmacy inventory system with complete details."}
            </DialogContentText>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Medication Name"
                  fullWidth
                  defaultValue={selectedItem?.name || ""}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Generic Name"
                  fullWidth
                  defaultValue={selectedItem?.genericName || ""}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="SKU Code"
                  fullWidth
                  defaultValue={selectedItem?.sku || ""}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Batch Number"
                  fullWidth
                  defaultValue={selectedItem?.batchNumber || ""}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Manufacturer"
                  fullWidth
                  defaultValue={selectedItem?.manufacturer || ""}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Current Stock"
                  type="number"
                  fullWidth
                  defaultValue={selectedItem?.quantity || ""}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Min Stock Level"
                  type="number"
                  fullWidth
                  defaultValue={selectedItem?.minStockLevel || ""}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Unit"
                  select
                  fullWidth
                  defaultValue={selectedItem?.unit || "tablets"}
                >
                  <MenuItem value="tablets">Tablets</MenuItem>
                  <MenuItem value="capsules">Capsules</MenuItem>
                  <MenuItem value="ml">Milliliters (ml)</MenuItem>
                  <MenuItem value="injections">Injections (vials)</MenuItem>
                  <MenuItem value="cream">Cream/Ointment</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Category"
                  fullWidth
                  defaultValue={selectedItem?.category || ""}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Purchase Price ($)"
                  type="number"
                  fullWidth
                  defaultValue={selectedItem?.purchasePrice || ""}
                  inputProps={{ step: "0.01" }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Selling Price ($)"
                  type="number"
                  fullWidth
                  defaultValue={selectedItem?.sellingPrice || ""}
                  inputProps={{ step: "0.01" }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Expiry Date"
                  type="date"
                  fullWidth
                  defaultValue={selectedItem?.expiryDate?.split("T")[0] || ""}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Storage Location"
                  fullWidth
                  defaultValue={selectedItem?.location || "Shelf A-1"}
                  placeholder="e.g., Shelf A-1, Refrigerator B-3"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="contained" onClick={handleClose}>
              {selectedItem ? "Update Inventory" : "Add to Inventory"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default PharmacyInventoryPage;