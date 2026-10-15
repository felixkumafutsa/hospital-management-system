
import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { formatCurrency } from "../../utils/currency";

interface Batch {
  id: string;
  batchNumber: string;
  quantityLeft: number;
  expiresAt: string;
  sellingPrice: number;
  costPrice: number;
  supplier: {
    name: string;
  };
}

interface InventoryItemDetails {
  id: string;
  name: string;
  form: string;
  strength: string;
  genericName: string;
  isOtc: boolean;
  reorderLevel: number;
  totalStock: number;
  batches: Batch[];
}

interface PharmacyInventoryItemDetailsProps {
  itemId: string;
}

const PharmacyInventoryItemDetails: React.FC<
  PharmacyInventoryItemDetailsProps
> = ({ itemId }) => {
  const {
    data: item,
    isLoading,
    error,
  } = useQuery<InventoryItemDetails>({
    queryKey: ["inventoryItem", itemId],
    queryFn: async () => {
      const res = await api.get(`/pharmacy/medicines/${itemId}`);
      const data = res.data.data;
      const totalStock =
        data.batches?.reduce(
          (sum: number, batch: any) => sum + batch.quantityLeft,
          0,
        ) || 0;
      return { ...data, totalStock };
    },
    enabled: !!itemId,
  });

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 4,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load item details. Please try again.
      </Alert>
    );
  }

  if (!item) {
    return <Typography>No item details available.</Typography>;
  }

  const sortedBatches =
    item.batches?.sort(
      (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
    ) || [];

  const totalValue = sortedBatches.reduce(
    (acc, batch) => acc + batch.quantityLeft * batch.sellingPrice,
    0,
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        {item.name}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Typography color="text.secondary">Form</Typography>
          <Typography>{item.form}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography color="text.secondary">Strength</Typography>
          <Typography>{item.strength || "N/A"}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography color="text.secondary">Generic Name</Typography>
          <Typography>{item.genericName || "N/A"}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography color="text.secondary">Total Stock</Typography>
          <Typography variant="h6" fontWeight={600}>
            {item.totalStock} units
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography color="text.secondary">Reorder Level</Typography>
          <Typography>{item.reorderLevel} units</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography color="text.secondary">Total Value</Typography>
          <Typography>{formatCurrency(totalValue)}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography color="text.secondary">OTC</Typography>
          <Chip
            label={item.isOtc ? "Yes" : "No"}
            color={item.isOtc ? "success" : "default"}
            size="small"
          />
        </Grid>
      </Grid>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Batches
      </Typography>
      {sortedBatches.length > 0 ? (
        <Paper variant="outlined">
          {sortedBatches.map((batch, index) => (
            <Box
              key={batch.id}
              sx={{
                p: 2,
                borderBottom:
                  index < sortedBatches.length - 1
                    ? "1px solid #eee"
                    : "none",
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Typography fontWeight={500}>
                    Batch: {batch.batchNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supplier: {batch.supplier?.name || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography>Qty: {batch.quantityLeft}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography
                    color={
                      new Date(batch.expiresAt) < new Date()
                        ? "error.main"
                        : "text.secondary"
                    }
                  >
                    Expires: {new Date(batch.expiresAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ))}
        </Paper>
      ) : (
        <Typography>No batch information available.</Typography>
      )}
    </Box>
  );
};

export default PharmacyInventoryItemDetails;