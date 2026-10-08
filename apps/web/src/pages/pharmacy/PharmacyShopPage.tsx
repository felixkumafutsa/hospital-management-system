import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Remove, ShoppingBag } from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { formatCurrency } from "../../utils/currency";

interface ShopMedicine {
  id: string;
  name: string;
  genericName?: string;
  strength?: string;
  form: string;
  unit: string;
  available: number;
  price: number;
  batches: Array<{ quantityLeft: number; sellingPrice: number }>;
}

const PharmacyShopPage = () => {
  const [search, setSearch] = useState("");
  const [patientId, setPatientId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [receipt, setReceipt] = useState("");
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, isError } = useQuery<ShopMedicine[]>({
    queryKey: ["otc-products"],
    queryFn: async () => {
      const response = await api.get("/pharmacy/medicines", { params: { limit: 100 } });
      const today = new Date();
      return (response.data.data || []).filter((medicine: any) => medicine.isOtc).map((medicine: any) => {
        const batches = (medicine.batches || []).filter((batch: any) =>
          batch.quantityLeft > 0 && new Date(batch.expiresAt) > today,
        );
        return {
          id: medicine.id,
          name: medicine.name,
          genericName: medicine.genericName,
          strength: medicine.strength,
          form: medicine.form,
          unit: medicine.unit,
          available: batches.reduce((sum: number, batch: any) => sum + batch.quantityLeft, 0),
          price: Number(batches[0]?.sellingPrice || 0),
          batches: batches.map((batch: any) => ({
            quantityLeft: batch.quantityLeft,
            sellingPrice: Number(batch.sellingPrice),
          })),
        } as ShopMedicine;
      }).filter((medicine: ShopMedicine) => medicine.available > 0 && medicine.price > 0);
    },
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["otc-patients"],
    queryFn: async () => (await api.get("/patients", { params: { limit: 100 } })).data.patients || [],
  });

  const checkout = useMutation({
    mutationFn: async () => {
      const response = await api.post("/pharmacy/sales/otc", {
        patientId,
        paymentMethod,
        items: Object.entries(cart).map(([medicineId, quantity]) => ({ medicineId, quantity })),
      });
      return response.data.data.invoice;
    },
    onSuccess: (invoice) => {
      setReceipt(invoice.invoiceNo);
      setCart({});
      queryClient.invalidateQueries({ queryKey: ["otc-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacyDashboardStats"] });
    },
  });

  const visibleProducts = products.filter((medicine) =>
    `${medicine.name} ${medicine.genericName || ""} ${medicine.strength || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const cartItems = Object.entries(cart)
    .map(([id, quantity]) => {
      const medicine = products.find((product) => product.id === id);
      if (!medicine) return undefined;
      let remaining = quantity;
      let subtotal = 0;
      for (const batch of medicine.batches) {
        if (remaining === 0) break;
        const allocated = Math.min(remaining, batch.quantityLeft);
        subtotal += allocated * batch.sellingPrice;
        remaining -= allocated;
      }
      return { medicine, quantity, subtotal };
    })
    .filter((entry): entry is { medicine: ShopMedicine; quantity: number; subtotal: number } => !!entry);
  const total = cartItems.reduce((sum, entry) => sum + entry.subtotal, 0);

  const updateQuantity = (medicine: ShopMedicine, delta: number) => {
    setCart((current) => {
      const nextQuantity = (current[medicine.id] || 0) + delta;
      if (nextQuantity <= 0) {
        const next = { ...current };
        delete next[medicine.id];
        return next;
      }
      return { ...current, [medicine.id]: Math.min(nextQuantity, medicine.available) };
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 650 }}>Medicine Shop</Typography>
          <Typography color="text.secondary">Non-prescription products available for direct purchase</Typography>
        </Box>
        <Chip icon={<ShoppingBag />} label={`${cartItems.length} products`} variant="outlined" />
      </Box>

      {receipt && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setReceipt("")}>Sale complete. Receipt {receipt} is paid and linked to a pharmacy visit.</Alert>}
      {checkout.isError && <Alert severity="error" sx={{ mb: 2 }}>Checkout failed. Check stock and try again.</Alert>}
      {isError && <Alert severity="error" sx={{ mb: 2 }}>Unable to load shop stock.</Alert>}

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} lg={8}>
          <TextField
            fullWidth
            placeholder="Search medicine or generic name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ mb: 2 }}
          />
          {isLoading ? <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box> : (
            <Grid container spacing={2}>
              {visibleProducts.map((medicine) => (
                <Grid item xs={12} sm={6} xl={4} key={medicine.id}>
                  <Paper variant="outlined" sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="h6">{medicine.name}</Typography>
                      <Chip size="small" label={`${medicine.available} ${medicine.unit}`} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {[medicine.genericName, medicine.strength, medicine.form].filter(Boolean).join(" · ")}
                    </Typography>
                    <Box sx={{ mt: "auto", pt: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Typography variant="subtitle1" fontWeight={700}>{formatCurrency(medicine.price)}</Typography>
                      <Button variant="contained" size="small" startIcon={<Add />} onClick={() => updateQuantity(medicine, 1)}>
                        Add
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
              {!visibleProducts.length && <Grid item xs={12}><Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No OTC medicines currently in stock.</Typography></Grid>}
            </Grid>
          )}
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper variant="outlined" sx={{ p: 2.5, position: { lg: "sticky" }, top: 16 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Checkout</Typography>
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <InputLabel>Registered Patient</InputLabel>
              <Select value={patientId} label="Registered Patient" onChange={(event) => setPatientId(event.target.value)}>
                {patients.map((patient: any) => (
                  <MenuItem key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName} · {patient.patientNumber}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack spacing={1.5} divider={<Divider flexItem />} sx={{ mb: 2 }}>
              {cartItems.map(({ medicine, quantity, subtotal }) => (
                <Box key={medicine.id} sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap fontWeight={600}>{medicine.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {quantity} x from {formatCurrency(medicine.price)} | {formatCurrency(subtotal)} estimated
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton size="small" aria-label={`Remove one ${medicine.name}`} onClick={() => updateQuantity(medicine, -1)}><Remove fontSize="small" /></IconButton>
                    <Typography sx={{ minWidth: 24, textAlign: "center" }}>{quantity}</Typography>
                    <IconButton size="small" aria-label={`Add one ${medicine.name}`} disabled={quantity >= medicine.available} onClick={() => updateQuantity(medicine, 1)}><Add fontSize="small" /></IconButton>
                  </Box>
                </Box>
              ))}
              {!cartItems.length && <Typography color="text.secondary">Cart is empty</Typography>}
            </Stack>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select value={paymentMethod} label="Payment Method" onChange={(event) => setPaymentMethod(event.target.value)}>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="AIRTEL_MONEY">Airtel Money</MenuItem>
                <MenuItem value="TNM_MPAMBA">TNM Mpamba</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank transfer</MenuItem>
                <MenuItem value="INSURANCE">Insurance</MenuItem>
              </Select>
            </FormControl>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" fontWeight={700}>{formatCurrency(total)}</Typography>
            </Box>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => checkout.mutate()}
              disabled={!patientId || !cartItems.length || checkout.isPending}
            >
              {checkout.isPending ? <CircularProgress size={22} color="inherit" /> : "Complete Sale"}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PharmacyShopPage;