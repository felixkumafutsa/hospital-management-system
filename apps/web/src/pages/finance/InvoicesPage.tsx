import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Drawer,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  Add,
  Visibility,
  AttachMoney,
  Close,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { formatCurrency } from "../../utils/currency";

interface InvoiceItem {
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  visit?: {
    id: string;
    visitDate: string;
  };
  status: "PAID" | "UNPAID" | "PARTIAL" | "VOID";
  subtotal: number;
  discount: number;
  total: number;
  balance: number;
  paidAmount: number;
  notes?: string;
  createdAt: string;
  items: InvoiceItem[];
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    receivedAt: string;
  }>;
}

interface NewInvoiceItem {
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

interface NewInvoice {
  patientId: string;
  visitId: string;
  notes?: string;
  items: NewInvoiceItem[];
  discount?: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "PAID":
      return "success";
    case "UNPAID":
      return "warning";
    case "PARTIAL":
      return "info";
    case "VOID":
      return "error";
    default:
      return "default";
  }
};

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case "CASH":
      return "Cash";
    case "AIRTEL_MONEY":
      return "Airtel Money";
    case "TNM_MPAMBA":
      return "TNM Mpamba";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "INSURANCE":
      return "Insurance";
    case "WAIVER":
      return "Waiver";
    default:
      return method;
  }
};

const InvoicesPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "CASH",
    reference: "",
    notes: "",
  });
  const queryClient = useQueryClient();

  const getPaymentBreakdown = (invoice: Invoice) => {
    const serviceSubtotal = invoice.items
      .filter((item) => item.category !== "MEDICATION")
      .reduce((sum, item) => sum + Number(item.subtotal), 0);
    const medicationSubtotal = invoice.items
      .filter((item) => item.category === "MEDICATION")
      .reduce((sum, item) => sum + Number(item.subtotal), 0);
    const discount = Number(invoice.discount);
    const serviceDueBeforePayment = Math.max(0, serviceSubtotal - Math.min(discount, serviceSubtotal));
    const medicationDueBeforePayment = Math.max(0, medicationSubtotal - Math.max(0, discount - serviceSubtotal));
    const paidTowardServices = Math.min(Number(invoice.paidAmount), serviceDueBeforePayment);
    const paidTowardMedication = Math.max(0, Number(invoice.paidAmount) - serviceDueBeforePayment);
    return {
      servicesDue: Math.max(0, serviceDueBeforePayment - paidTowardServices),
      medicationDue: Math.max(0, medicationDueBeforePayment - paidTowardMedication),
    };
  };

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await api.get("/finance/invoices", { params: { limit: 100 } });
      const invoices = res.data?.data ?? res.data?.invoices;
      return Array.isArray(invoices) ? invoices : [];
    },
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await api.get("/patients");
      return res.data.patients;
    },
  });

  const { data: visits = [] } = useQuery({
    queryKey: ["visits"],
    queryFn: async () => {
      const res = await api.get("/visits");
      return res.data.visits;
    },
  });

  const { data: pricingSettings } = useQuery({
    queryKey: ["system-pricing"],
    queryFn: async () => {
      const response = await api.get("/settings/pricing");
      return response.data?.settings;
    },
  });
  const consultationFee = Number(pricingSettings?.consultationFee || 0);

  const [newInvoice, setNewInvoice] = useState<NewInvoice>({
    patientId: "",
    visitId: "",
    items: [{ description: "", category: "CONSULTATION", quantity: 1, unitPrice: 0 }],
    discount: 0,
  });

  useEffect(() => {
    if (consultationFee <= 0) return;
    setNewInvoice((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.category === "CONSULTATION" && item.unitPrice <= 0
          ? { ...item, unitPrice: consultationFee }
          : item,
      ),
    }));
  }, [consultationFee]);

  const addInvoiceItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: "", category: "CONSULTATION", quantity: 1, unitPrice: consultationFee }],
    });
  };

  const removeInvoiceItem = (index: number) => {
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter((_, i) => i !== index),
    });
  };

  const updateInvoiceItem = (index: number, field: string, value: string | number) => {
    const updatedItems = [...newInvoice.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    // Calculate subtotal for this item
    if (field === "quantity" || field === "unitPrice") {
      const quantity = typeof updatedItems[index].quantity === 'string' ? parseFloat(updatedItems[index].quantity) : updatedItems[index].quantity;
      const unitPrice = typeof updatedItems[index].unitPrice === 'string' ? parseFloat(updatedItems[index].unitPrice) : updatedItems[index].unitPrice;
      updatedItems[index].subtotal = quantity * unitPrice;
    }
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };

  const calculateTotal = () => {
    const itemsTotal = newInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discount = newInvoice.discount || 0;
    return itemsTotal - discount;
  };

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: NewInvoice) => {
      await api.post("/finance/invoices", invoiceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacyPrescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacyDashboardStats"] });
      setIsCreateDialogOpen(false);
      setNewInvoice({
        patientId: "",
        visitId: "",
        items: [{ description: "", category: "CONSULTATION", quantity: 1, unitPrice: 0 }],
        discount: 0,
      });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async ({ invoiceId, paymentData }: { invoiceId: string; paymentData: any }) => {
      await api.post(`/finance/invoices/${invoiceId}/payments`, paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacyPrescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacyDashboardStats"] });
      setIsPaymentDialogOpen(false);
      setPaymentForm({ amount: "", method: "CASH", reference: "", notes: "" });
      setSelectedInvoice(null);
    },
  });

  const handleCreateInvoice = () => {
    createInvoiceMutation.mutate(newInvoice);
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice) return;
    recordPaymentMutation.mutate({
      invoiceId: selectedInvoice.id,
      paymentData: {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
      },
    });
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const searchString = `${invoice.invoiceNo} ${invoice.patient.firstName} ${invoice.patient.lastName} ${invoice.status}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const paginatedInvoices = filteredInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Invoices
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Create Invoice
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by invoice number, patient name, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 500 }}
        />
      </Paper>

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.invoiceNo}</TableCell>
                  <TableCell>
                    {invoice.patient.firstName} {invoice.patient.lastName}
                  </TableCell>
                  <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{formatCurrency(invoice.total)}</TableCell>
                  <TableCell>{formatCurrency(invoice.balance)}</TableCell>
                  <TableCell>
                    <Chip label={invoice.status} color={getStatusColor(invoice.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => setSelectedInvoice(invoice)} size="small">
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredInvoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Invoice Details Drawer */}
      <Drawer
        anchor="right"
        open={!!selectedInvoice && !isPaymentDialogOpen}
        onClose={() => setSelectedInvoice(null)}
        sx={{ width: 500, flexShrink: 0, "& .MuiDrawer-paper": { width: 500, p: 3 } }}
      >
        {selectedInvoice && (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h5">Invoice Details</Typography>
              <IconButton onClick={() => setSelectedInvoice(null)}>
                <Close />
              </IconButton>
            </Box>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Invoice #{selectedInvoice.invoiceNo}
            </Typography>
            <Chip
              label={selectedInvoice.status}
              color={getStatusColor(selectedInvoice.status)}
              sx={{ mb: 3 }}
            />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Patient</Typography>
              <Typography>
                {selectedInvoice.patient.firstName} {selectedInvoice.patient.lastName}
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Invoice Items</Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedInvoice.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                  <Typography>{formatCurrency(selectedInvoice.subtotal)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Discount</Typography>
                  <Typography>{formatCurrency(selectedInvoice.discount)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Paid Amount</Typography>
                  <Typography>{formatCurrency(selectedInvoice.paidAmount)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Balance</Typography>
                  <Typography variant="h6" color={selectedInvoice.balance > 0 ? "error.main" : "success.main"}>
                    {formatCurrency(selectedInvoice.balance)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {(() => {
              const breakdown = getPaymentBreakdown(selectedInvoice);
              return (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Services due: {formatCurrency(breakdown.servicesDue)}
                  </Typography>
                  <Typography variant="body2">
                    Medication due: {formatCurrency(breakdown.medicationDue)}
                  </Typography>
                  Payments are applied to services first. Medication dispensing is held until medication charges are paid.
                </Alert>
              );
            })()}

            {selectedInvoice.payments.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Payment History</Typography>
                {selectedInvoice.payments.map((payment) => (
                  <Paper key={payment.id} sx={{ p: 2, mb: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <AttachMoney fontSize="small" color="action" />
                          <Typography variant="body2">{formatCurrency(payment.amount)}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">{getPaymentMethodLabel(payment.method)}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(payment.receivedAt).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            )}

            {selectedInvoice.balance > 0 && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<AttachMoney />}
                sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
                onClick={() => setIsPaymentDialogOpen(true)}
              >
                Record Payment
              </Button>
            )}
          </Box>
        )}
      </Drawer>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onClose={() => setIsPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 0.5 }}>
                <AttachMoney fontSize="small" />
                Remaining Balance: {formatCurrency(selectedInvoice.balance)}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    inputProps={{ min: 0, max: selectedInvoice.balance }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentForm.method}
                      label="Payment Method"
                      onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    >
                      <MenuItem value="CASH">Cash</MenuItem>
                      <MenuItem value="AIRTEL_MONEY">Airtel Money</MenuItem>
                      <MenuItem value="TNM_MPAMBA">TNM Mpamba</MenuItem>
                      <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                      <MenuItem value="INSURANCE">Insurance</MenuItem>
                      <MenuItem value="WAIVER">Waiver</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Transaction Reference (Optional)"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes (Optional)"
                    multiline
                    rows={3}
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRecordPayment}
            disabled={recordPaymentMutation.isPending || !paymentForm.amount}
            sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
          >
            {recordPaymentMutation.isPending ? <CircularProgress size={24} /> : "Record Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Invoice Drawer */}
      <Drawer
        anchor="right"
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        sx={{ width: 700, flexShrink: 0, "& .MuiDrawer-paper": { width: 700, p: 3 } }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5">Create New Invoice</Typography>
          <IconButton onClick={() => setIsCreateDialogOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Patient</InputLabel>
                <Select
                  value={newInvoice.patientId}
                  label="Patient"
                  onChange={(e) => setNewInvoice({ ...newInvoice, patientId: e.target.value, visitId: "" })}
                >
                  {patients.map((patient: any) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required disabled={!newInvoice.patientId}>
                <InputLabel>Visit</InputLabel>
                <Select
                  value={newInvoice.visitId}
                  label="Visit"
                  onChange={(e) => setNewInvoice({ ...newInvoice, visitId: e.target.value })}
                >
                  {visits
                    .filter((visit: any) => visit.patientId === newInvoice.patientId || visit.patient?.id === newInvoice.patientId)
                    .map((visit: any) => (
                      <MenuItem key={visit.id} value={visit.id}>
                        Visit on {new Date(visit.visitDate).toLocaleDateString()}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {newInvoice.items.map((item, index) => (
              <Grid item xs={12} key={index}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={item.description}
                        onChange={(e) => updateInvoiceItem(index, "description", e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={item.category}
                          label="Category"
                          onChange={(e) => updateInvoiceItem(index, "category", e.target.value)}
                        >
                          <MenuItem value="CONSULTATION">Consultation</MenuItem>
                          <MenuItem value="PROCEDURE">Procedure</MenuItem>
                          <MenuItem value="LAB_TEST">Lab Test</MenuItem>
                          <MenuItem value="MEDICATION">Medication</MenuItem>
                          <MenuItem value="OTHER">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={2}>
                      <TextField
                        fullWidth
                        label="Quantity"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItem(index, "quantity", parseInt(e.target.value))}
                        required
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField
                        fullWidth
                        label="Unit Price"
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateInvoiceItem(index, "unitPrice", parseFloat(e.target.value))}
                        required
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Typography>
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </Typography>
                    </Grid>
                    <Grid item xs={1}>
                      {newInvoice.items.length > 1 && (
                        <IconButton onClick={() => removeInvoiceItem(index)} color="error">
                          <Close />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button variant="outlined" onClick={addInvoiceItem} startIcon={<Add />}>
                Add Item
              </Button>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Discount"
                type="number"
                value={newInvoice.discount || 0}
                onChange={(e) => setNewInvoice({ ...newInvoice, discount: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ pt: 1 }}>
                Total: {formatCurrency(calculateTotal())}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={newInvoice.notes || ""}
                onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleCreateInvoice}
                disabled={createInvoiceMutation.isPending || !newInvoice.patientId || !newInvoice.visitId || newInvoice.items.some(item => !item.description || item.unitPrice <= 0)}
                sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
              >
                {createInvoiceMutation.isPending ? <CircularProgress size={24} /> : "Create Invoice"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Drawer>
    </Box>
  );
};

export default InvoicesPage;
