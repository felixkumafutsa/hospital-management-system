import {
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
} from "@mui/material";
import {
  AttachMoney,
  AccountBalanceWallet,
  ReceiptLong,
} from "@mui/icons-material";
import MainLayout from "../../components/layout/MainLayout";

const FinanceDashboardPage = () => {
  const recentTransactions = [
    {
      id: "INV-001",
      patient: "Alice Johnson",
      amount: 450.0,
      method: "Insurance",
      date: "2024-05-21",
      status: "PAID",
    },
    {
      id: "INV-002",
      patient: "Bob Wilson",
      amount: 120.5,
      method: "Cash",
      date: "2024-05-21",
      status: "PENDING",
    },
    {
      id: "INV-003",
      patient: "Charlie Davis",
      amount: 300.0,
      method: "Mobile Money",
      date: "2024-05-20",
      status: "PAID",
    },
  ];

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Financial Overview
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Revenue tracking and billing management
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              title: "Today's Revenue",
              val: "$1,245.00",
              icon: <AttachMoney />,
              color: "#2e7d32",
            },
            {
              title: "Monthly Earnings",
              val: "$42,890.00",
              icon: <AccountBalanceWallet />,
              color: "#0EA5A4",
            },
            {
              title: "Pending Invoices",
              val: "18",
              icon: <ReceiptLong />,
              color: "#ed6c02",
            },
          ].map((item, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                    {item.val}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: `${item.color}15`,
                    color: item.color,
                    height: "fit-content",
                  }}
                >
                  {item.icon}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Recent Transactions
        </Typography>
        <Paper sx={{ borderRadius: "16px", overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Invoice ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Payment Method</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{tx.id}</TableCell>
                    <TableCell>{tx.patient}</TableCell>
                    <TableCell>${tx.amount.toFixed(2)}</TableCell>
                    <TableCell>{tx.method}</TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: "4px",
                          bgcolor:
                            tx.status === "PAID"
                              ? "success.light"
                              : "warning.light",
                          color:
                            tx.status === "PAID"
                              ? "success.dark"
                              : "warning.dark",
                          fontWeight: 700,
                        }}
                      >
                        {tx.status}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default FinanceDashboardPage;
