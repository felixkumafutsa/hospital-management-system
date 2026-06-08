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

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unitPrice: number;
  supplier: string;
  expiryDate: string;
  status: string;
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

  const categoryOptions = [
    "Pharmaceuticals",
    "Medical Supplies",
    "Equipment",
    "Disposables",
    "Vaccines",
    "Other",
  ];

  interface InventoryFormData {
    name: string;
    sku: string;
    category: string;
    quantity: number;
    minStock: number;
    unitPrice: number;
    supplier: string;
    expiryDate: string;
    location: string;
    notes: string;
    status: string;
  }

  const initialFormData: InventoryFormData = {
    name: "",
    sku: "",
    category: "",
    quantity: 0,
    minStock: 10,
    unitPrice: 0,
    supplier: "",
    expiryDate: "",
    location: "",
    notes: "",
    status: "IN_STOCK",
  };

  const [formData, setFormData] = useState<InventoryFormData>(initialFormData);

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

  // Mutation for adding new inventory item
  const addItemMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      const res = await api.post("/inventory", data);
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
      return res.data.items as InventoryItem[];
    },
  });

  // Filter inventory items based on search term
  const filteredItems =
    inventoryItems?.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const getStatusColor = (item: InventoryItem) => {
    if (item.quantity <= 0) return "error";
    if (item.quantity < item.minStock) return "warning";
    return "success";
  };

  const getStatusLabel = (item: InventoryItem) => {
    if (item.quantity <= 0) return "Out of Stock";
    if (item.quantity < item.minStock) return "Low Stock";
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
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                {categoryOptions.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about this medication"
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
                label="Unit Price ($)"
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
                      <strong>SKU:</strong> {formData.sku}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Category:</strong> {formData.category}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Quantity:</strong> {formData.quantity} units
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <strong>Unit Price:</strong> $
                      {formData.unitPrice.toFixed(2)}
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
            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={addItemMutation.isPending}
                sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
              >
                {addItemMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Add to Inventory"
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
                  $
                  {inventoryItems
                    ?.reduce(
                      (acc, item) => acc + item.quantity * item.unitPrice,
                      0,
                    )
                    .toLocaleString() || "0"}
                </Typography>
              </Box>
              <Box sx={{ fontSize: 40, color: "#0EA5A4", opacity: 0.5 }}>$</Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search inventory by name, SKU, category, or supplier..."
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
                    <TableCell sx={{ fontWeight: "bold" }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>In Stock</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Unit Price
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
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.category}
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
                        </TableCell>
                        <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
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
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
              disabled={!formData.name || !formData.sku || !formData.category}
            >
              Next
            </Button>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default PharmacyInventoryPage;
