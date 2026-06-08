import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Grid,
  alpha,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import MainLayout from "../../components/layout/MainLayout";

const PRIMARY_COLOR = "#0EA5A4";

const PharmacyInventoryPage = () => {
  // Mock inventory data
  const inventory = [
    {
      id: "1",
      name: "Amoxicillin 500mg",
      category: "Antibiotic",
      stock: 450,
      minStock: 100,
      expiry: "2025-08-12",
    },
    {
      id: "2",
      name: "Paracetamol 500mg",
      category: "Analgesic",
      stock: 1200,
      minStock: 200,
      expiry: "2026-01-20",
    },
    {
      id: "3",
      name: "Metformin 850mg",
      category: "Antidiabetic",
      stock: 85,
      minStock: 100,
      expiry: "2024-12-05",
    },
    {
      id: "4",
      name: "Omeprazole 20mg",
      category: "Antacid",
      stock: 310,
      minStock: 50,
      expiry: "2025-03-15",
    },
  ];

  return (
    <MainLayout>
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Pharmacy Inventory
            </Typography>
            <Typography color="text.secondary">
              Maintain drug stock levels and expiry tracking
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{
              bgcolor: PRIMARY_COLOR,
              "&:hover": { bgcolor: "#0c8c8b" },
              borderRadius: "10px",
              px: 3,
            }}
          >
            New Stock Entry
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} lg={3}>
            <Paper
              sx={{
                p: 3,
                borderRadius: "16px",
                bgcolor: PRIMARY_COLOR,
                color: "white",
              }}
            >
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                Total SKU Count
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                142
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Paper
              sx={{ p: 3, borderRadius: "16px", border: "1px solid #EF4444" }}
            >
              <Typography variant="subtitle2" color="error">
                Low Stock Alerts
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#EF4444" }}
              >
                12
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper
          sx={{
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>
                    Medication Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>In Stock</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Expiry Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.map((item) => {
                  const isLow = item.stock < item.minStock;
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.stock} units</TableCell>
                      <TableCell>
                        <Chip
                          label={isLow ? "Low Stock" : "Sufficient"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: isLow
                              ? alpha("#EF4444", 0.1)
                              : alpha("#10B981", 0.1),
                            color: isLow ? "#EF4444" : "#10B981",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              new Date(item.expiry) < new Date()
                                ? "#EF4444"
                                : "inherit",
                          }}
                        >
                          {item.expiry}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default PharmacyInventoryPage;
