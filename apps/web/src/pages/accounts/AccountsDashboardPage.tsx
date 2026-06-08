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
  Chip,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AttachMoney,
  Receipt,
  TrendingUp,
  CheckCircle,
  Visibility,
} from "@mui/icons-material";
import api from "../../services/api";

interface InvoiceQueueItem {
  id: string;
  patient: {
    firstName: string;
    lastName: string;
    patientNumber: string;
  };
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  dueDate: string;
}

const AccountsDashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pendingInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["pendingInvoices"],
    queryFn: async () => {
      const response = await api.get("/invoices/pending");
      return response.data.invoices as InvoiceQueueItem[];
    },
  });

  const { data: todayRevenue } = useQuery({
    queryKey: ["todayRevenue"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get("/invoices/revenue", {
        params: { fromDate: today, toDate: today },
      });
      return response.data.total as number;
    },
  });

  const { data: monthlyRevenue } = useQuery({
    queryKey: ["monthlyRevenue"],
    queryFn: async () => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];
      const response = await api.get("/invoices/revenue", {
        params: { fromDate: firstDay, toDate: lastDay },
      });
      return response.data.total as number;
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      await api.post(`/invoices/${invoiceId}/pay`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingInvoices"] });
      queryClient.invalidateQueries({ queryKey: ["todayRevenue"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyRevenue"] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "success";
      case "PENDING":
        return "warning";
      case "OVERDUE":
        return "error";
      case "PARTIAL":
        return "info";
      default:
        return "default";
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    isCurrency = false,
  }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    isCurrency?: boolean;
  }) => (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4">
              {isCurrency ? `MWK ${Number(value).toLocaleString()}` : value}
            </Typography>
          </Box>
          <Box
            sx={{ p: 1, borderRadius: "50%", backgroundColor: `${color}20` }}
          >
            <Icon sx={{ color }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const handleMarkAsPaid = (id: string) => {
    markAsPaidMutation.mutate(id);
  };

  return (
      <Box sx={{ width: "100%", mt: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4">Accounts & Finance Dashboard</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Receipt />}
              onClick={() => navigate("/invoices/create")}
            >
              Create Invoice
            </Button>
            <Button
              variant="outlined"
              startIcon={<AttachMoney />}
              onClick={() => navigate("/invoices")}
            >
              View All Invoices
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Today's Revenue"
              value={todayRevenue || 0}
              icon={AttachMoney}
              color="#2e7d32"
              isCurrency
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Monthly Revenue"
              value={monthlyRevenue || 0}
              icon={TrendingUp}
              color="#1976d2"
              isCurrency
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Invoices"
              value={
                pendingInvoices?.filter((i) => i.status === "PENDING").length ||
                0
              }
              icon={Receipt}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Paid Today"
              value={
                pendingInvoices?.filter((i) => i.status === "PAID").length || 0
              }
              icon={CheckCircle}
              color="#9c27b0"
            />
          </Grid>
        </Grid>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Pending Invoices
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Patient Number</TableCell>
                  <TableCell>Amount (MWK)</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoicesLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : !pendingInvoices || pendingInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No pending invoices
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        {invoice.patient.firstName} {invoice.patient.lastName}
                      </TableCell>
                      <TableCell>{invoice.patient.patientNumber}</TableCell>
                      <TableCell>
                        {invoice.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status}
                          color={getStatusColor(invoice.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                          sx={{ mr: 1 }}
                        >
                          View
                        </Button>
                        {invoice.status !== "PAID" && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            disabled={markAsPaidMutation.isPending}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
  );
};

export default AccountsDashboardPage;
