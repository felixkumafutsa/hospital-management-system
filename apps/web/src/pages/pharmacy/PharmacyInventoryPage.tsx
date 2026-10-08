import React, { useState } from "react";
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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  LocalPharmacy,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { formatCurrency } from "../../utils/currency";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  form: string;
  quantity: number;
  expiredQuantity: number;
  minStock: number;
  unitPrice: number;
  supplier: string;
  expiryDate: string;
  status: string;
  isOtc: boolean;
  location: string;
  createdAt: string;
}

const PharmacyInventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // New inventory item form state
  const steps = [
    "Basic Information",
    "Inventory Details",
    "Supplier & Location",
    "Review & Submit",
  ];

  const formOptions = [
    "TABLET",
    "CAPSULE",
    "SYRUP",
    "INJECTION",
    "CREAM",
    "OINTMENT",
    "DROPS",
    "INHALER",
    "SUPPOSITORY",
    "OTHER",
  ];

  interface InventoryFormData {
    name: string;
    sku: string;
    form: string; // Changed from category
    unit: string; // Added unit
    quantity: number;
    minStock: number;
    unitPrice: number;
    costPrice: number;
    genericName: string;
    strength: string;
    isOtc: boolean;
    supplier: string;
    expiryDate: string;
    location: string;
    notes: string;
    status: string;
  }

  const initialFormData: InventoryFormData = {
    name: "",
    sku: "",
    form: "", // Changed from category
    unit: "", // Added unit
    quantity: 0,
    minStock: 10,
    unitPrice: 0,
    costPrice: 0,
    genericName: "",
    strength: "",
    isOtc: false,
    supplier: "",
    expiryDate: "",
    location: "",
    notes: "",
    status: "IN_STOCK",
  };

  const [formData, setFormData] = useState<InventoryFormData>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberFields = ["quantity", "minStock", "unitPrice", "costPrice"];
    if (numberFields.includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
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

  // Mutation for adding new inventory item
  const addItemMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      const res = await api.post("/pharmacy/stock/receive", {
        name: data.name,
        genericName: data.genericName || undefined,
        strength: data.strength || undefined,
        isOtc: data.isOtc,
        form: data.form,
        unit: data.unit,
        reorderLevel: data.minStock,
        batchNumber: data.sku,
        quantity: data.quantity,
        costPrice: data.costPrice,
        sellingPrice: data.unitPrice,
        supplierName: data.supplier,
        expiresAt: new Date(data.expiryDate).toISOString(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      handleCloseDrawer();
    },
  });

  const handleSubmit = () => {
    addItemMutation.mutate(formData);
  };

  // Fetch inventory items from API
  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await api.get("/pharmacy/medicines");
      return (res.data.data || []).map((medicine: any) => {
        const batches = medicine.batches || [];
        const now = new Date();
        const usableBatches = batches.filter((batch: any) => new Date(batch.expiresAt) > now);
        const currentBatch = usableBatches[0] || batches[0];
        return {
          id: medicine.id,
          sku: currentBatch?.batchNumber || "No batch",
          name: medicine.name,
          form: medicine.form,
          isOtc: medicine.isOtc,
          quantity: usableBatches.reduce((sum: number, batch: any) => sum + batch.quantityLeft, 0),
          expiredQuantity: batches
            .filter((batch: any) => new Date(batch.expiresAt) <= now)
            .reduce((sum: number, batch: any) => sum + batch.quantityLeft, 0),
          minStock: medicine.reorderLevel,
          unitPrice: Number(currentBatch?.sellingPrice || 0),
          supplier: currentBatch?.supplier?.name || "No active stock",
          expiryDate: currentBatch?.expiresAt || "",
          status: "IN_STOCK",
          location: "",
          createdAt: medicine.createdAt,
        } as InventoryItem;
      }) as InventoryItem[];
    },
    // Use placeholderData to keep previous data while refetching
    placeholderData: (previousData) => previousData,
  });

  // Filter inventory items based on search term
  const filteredItems =
    (inventoryItems || [])?.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.form.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const getStatusColor = (item: InventoryItem) => {
    if (item.quantity <= 0) return item.expiredQuantity > 0 ? "error" : "default";
    if (item.quantity < item.minStock) return "warning";
    if (item.expiryDate && new Date(item.expiryDate).getTime() <= Date.now() + 30 * 24 * 60 * 60 * 1000) return "warning";
    return "success";
  };

  const getStatusLabel = (item: InventoryItem) => {
    if (item.quantity <= 0 && item.expiredQuantity > 0) return "Expired Stock";
    if (item.quantity <= 0) return "Out of Stock";
    if (item.quantity < item.minStock) return "Low Stock";
    if (item.expiryDate && new Date(item.expiryDate).getTime() <= Date.now() + 30 * 24 * 60 * 60 * 1000) return "Expiring Soon";
    return "In Stock";
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
                label="Item Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Batch Number"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Form"
                name="form"
                value={formData.form}
                onChange={handleInputChange}
                required
              >
                {formOptions.map((form) => (
                  <MenuItem key={form} value={form}>
                    {form}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit (e.g., mg, ml)"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Generic Name (Optional)"
                name="genericName"
                value={formData.genericName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Strength (Optional)"
                name="strength"
                value={formData.strength}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        );

      case 1: // Inventory Details
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity in Stock"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Stock Level"
                name="minStock"
                type="number"
                value={formData.minStock}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cost Price (MWK)"
                name="costPrice"
                type="number"
                value={formData.costPrice}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Selling Price (MWK)"
                name="unitPrice"
                type="number"
                value={formData.unitPrice}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isOtc}
                    onChange={(event) => setFormData((current) => ({ ...current, isOtc: event.target.checked }))}
                  />
                }
                label="Available for over-the-counter purchase"
              />
            </Grid>
          </Grid>
        );

      case 2: // Supplier & Location
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Storage Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Shelf A3, Refrigerator 2"
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
                  Inventory Item Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Item Name:</strong> {formData.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Batch:</strong> {formData.sku}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Form:</strong> {formData.form}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Unit:</strong> {formData.unit}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Quantity:</strong> {formData.quantity} units
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Cost Price:</strong> {formatCurrency(formData.costPrice)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Selling Price:</strong> {formatCurrency(formData.unitPrice)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Total Value:</strong> $
                      {(formData.quantity * formData.unitPrice).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Supplier:</strong> {formData.supplier}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Storage:</strong>{" "}
                      {formData.location || "Not specified"}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
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
            Pharmacy Inventory
          </Typography>
          <Typography color="text.secondary">
            Manage medications, supplies, and stock levels
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
          Add Inventory Item
        </Button>
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
                  Total Items
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {inventoryItems?.length || 0}
                </Typography>
              </Box>
              <LocalPharmacy
                sx={{ fontSize: 40, color: "#0EA5A4", opacity: 0.5 }}
              />
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
                  Low Stock
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {inventoryItems?.filter(
                    (item) =>
                      item.quantity < item.minStock && item.quantity > 0,
                  ).length || 0}
                </Typography>
              </Box>
              <Chip label="Warning" color="warning" size="small" />
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
                  Out of Stock
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {inventoryItems?.filter((item) => item.quantity <= 0)
                    .length || 0}
                </Typography>
              </Box>
              <Chip label="Critical" color="error" size="small" />
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
                  Total Value
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {formatCurrency(inventoryItems?.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0) || 0)}
                </Typography>
              </Box>
              <Box sx={{ fontSize: 24, color: "#0EA5A4", opacity: 0.7 }}>MWK</Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search inventory by name, SKU, form, or supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
        />
      </Paper>

      {/* Inventory Table */}
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
                    <TableCell sx={{ fontWeight: "bold" }}>Batch</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Form</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>In Stock</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Expiry</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Selling Price
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ fontFamily: "monospace" }}>
                          {item.sku}
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.supplier}
                          </Typography>
                          {item.isOtc && <Chip label="OTC" size="small" color="success" sx={{ mt: 0.5 }} />}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.form}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>
                            {item.quantity}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Min: {item.minStock}
                          </Typography>
                          {!!item.expiredQuantity && (
                            <Typography variant="body2" color="error.main">
                              Expired: {item.expiredQuantity}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(item)}
                            color={getStatusColor(item) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/inventory/${item.id}`)}
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
                  {filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No inventory items found matching your search
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
              count={filteredItems.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Add Item Drawer */}
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
            Add Inventory Item
          </Typography>
          <Typography color="text.secondary">
            Add a new medication or supply to the pharmacy inventory
          </Typography>
        </Box>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box sx={{ flexGrow: 1, overflowY: "auto", p: 0.5 }}>
          {renderStepContent()}
        </Box>
        <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
          <Button
            onClick={activeStep === 0 ? handleCloseDrawer : handleBack}
          >
            {activeStep === 0 ? "Cancel" : "Back"}
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={addItemMutation.isPending || !formData.name || !formData.sku || !formData.form || !formData.unit || formData.quantity <= 0 || formData.costPrice <= 0 || formData.unitPrice <= 0 || !formData.supplier || !formData.expiryDate}
              sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
            >
              {addItemMutation.isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Add to Inventory"
              )}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                (activeStep === 0 && (!formData.name || !formData.sku || !formData.form || !formData.unit)) ||
                (activeStep === 1 && (formData.quantity <= 0 || formData.costPrice <= 0 || formData.unitPrice <= 0 || !formData.expiryDate)) ||
                (activeStep === 2 && !formData.supplier)
              }
            >
              {activeStep === steps.length - 2 ? "Review" : "Next"}
            </Button>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default PharmacyInventoryPage;