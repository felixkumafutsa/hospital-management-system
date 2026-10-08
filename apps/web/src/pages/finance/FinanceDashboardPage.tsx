import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  Receipt,
  AttachMoney,
  ShoppingCart,
  AccountBalance,
  AccountBalanceWallet,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { formatCurrency } from "../../utils/currency";

// Interfaces kept for future use (TypeScript requires they be used or removed)
// interface RevenueData {
//   month: string;
//   revenue: number;
//   expenses: number;
// }

// interface Invoice {
//   id: string;
//   patientName: string;
//   date: string;
//   amount: number;
//   status: "PAID" | "UNPAID" | "OVERDUE";
//   type: string;
// }

const FinanceDashboardPage = () => {
  const { data: revenueData = [], isLoading: revenueLoading } = useQuery({
    queryKey: ["revenue-data"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/revenue");
        const data = res.data?.data ?? res.data;
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching revenue data:", error);
        return [];
      }
    },
  });

  const { data: recentInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["recent-invoices"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/invoices/recent");
        const invoices = Array.isArray(res.data)
          ? res.data
          : res.data?.data?.invoices ??
            res.data?.data ??
            res.data?.invoices ??
            [];
        return invoices.map((invoice: any) => ({
          id: invoice.id,
          patientName: `${invoice.patient?.firstName || ""} ${invoice.patient?.lastName || ""}`.trim() || "Unknown patient",
          date: invoice.createdAt,
          amount: Number(invoice.total ?? 0),
          status: invoice.status,
          type: [...new Set((invoice.items || []).map((item: any) => item.category))].join(", ") || "General",
        }));
      } catch (error) {
        console.error("Error fetching recent invoices:", error);
        return [];
      }
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["finance-stats"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/stats");
        const data =
          res.data?.data?.stats ??
          res.data?.data ??
          res.data?.stats ??
          res.data;
        if (!data || typeof data !== "object") return null;

        const amount = (value: unknown) => {
          const numericValue = Number(value ?? 0);
          return Number.isFinite(numericValue) ? numericValue : 0;
        };
        const hasStats = [
          "totalRevenue",
          "monthlyRevenue",
          "totalBilled",
          "totalPaid",
          "totalOutstanding",
        ].some((key) => key in data);
        if (!hasStats) return null;

        return {
          totalRevenue: amount(data.totalRevenue),
          monthlyRevenue: amount(data.monthlyRevenue),
          unpaidInvoicesCount: amount(data.unpaidInvoicesCount),
          totalInvoices: amount(data.totalInvoices),
          totalBilled: amount(data.totalBilled),
          totalPaid: amount(data.totalPaid),
          totalOutstanding: amount(data.totalOutstanding),
        };
      } catch (error) {
        console.error("Error fetching finance stats:", error);
        return null;
      }
    },
  });

  // Fetch department revenue breakdown
  const { data: departmentRevenueData = [] } = useQuery({
    queryKey: ["department-revenue"],
    queryFn: async () => {
      try {
        const invoicesRes = await api.get("/finance/invoices", { params: { limit: 100 } });

        const invoices =
          invoicesRes.data?.data?.invoices ??
          invoicesRes.data?.data ??
          invoicesRes.data?.invoices ??
          [];

        // Group invoices by category to get department revenue
        const deptMap = new Map<string, number>();

        invoices.forEach((invoice: any) => {
          invoice.items?.forEach((item: any) => {
            const category = item.category || "Other Services";
            deptMap.set(
              category,
              (deptMap.get(category) || 0) + Number(item.unitPrice || 0) * Number(item.quantity || 0),
            );
          });
        });

        // Default departments
        const defaultDepts = [
          { name: "Consultation", value: 0 },
          { name: "Pharmacy", value: 0 },
          { name: "Lab", value: 0 },
          { name: "Inpatient", value: 0 },
        ];

        // Populate with actual data
        deptMap.forEach((value, key) => {
          const dept = defaultDepts.find((d) =>
            d.name.toLowerCase().includes(key.toLowerCase()),
          );
          if (dept) {
            dept.value = Math.round(value);
          }
        });

        return defaultDepts.filter((d) => d.value > 0).length > 0
          ? defaultDepts.filter((d) => d.value > 0)
          : defaultDepts;
      } catch {
        return [
          { name: "Consultation", value: 0 },
          { name: "Pharmacy", value: 0 },
          { name: "Lab", value: 0 },
          { name: "Inpatient", value: 0 },
        ];
      }
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "success";
      case "UNPAID":
        return "warning";
      case "OVERDUE":
        return "error";
      default:
        return "default";
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    description,
    color,
  }: any) => (
    <Card elevation={2} sx={{ minWidth: 200, flex: 1, position: "relative" }}>
      <CardContent sx={{ padding: "20px 24px !important" }}>
        <Box
          sx={{
            position: "absolute",
            top: 20,
            right: 24,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: color + "20",
          }}
        >
          <Icon sx={{ fontSize: 28, color }} />
        </Box>
        <Box>
          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ mb: 1, pr: 10 }}
          >
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          Finance Dashboard
        </Typography>
        <Typography color="text.secondary">
          Track revenue, expenses, and manage clinic finances
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          mb: 4,
          width: "100%",
        }}
      >
        {statsLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              p: 4,
              width: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : stats ? (
          <>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon={AttachMoney}
              description="Payments received"
              color="#1976d2"
            />
            <StatCard
              title="Revenue This Month"
              value={formatCurrency(stats.monthlyRevenue)}
              icon={Receipt}
              description="Payments received this month"
              color="#2e7d32"
            />
            <StatCard
              title="Total Billed"
              value={formatCurrency(stats.totalBilled)}
              icon={ShoppingCart}
              description={`${Number(stats.totalInvoices) || 0} invoices`}
              color="#ed6c02"
            />
            <StatCard
              title="Total Paid"
              value={formatCurrency(stats.totalPaid)}
              icon={AccountBalanceWallet}
              description="Applied to invoices"
              color="#0288d1"
            />
            <StatCard
              title="Outstanding Balance"
              value={formatCurrency(stats.totalOutstanding)}
              icon={AccountBalance}
              description={`${Number(stats.unpaidInvoicesCount) || 0} unpaid invoices`}
              color="#9c27b0"
            />
          </>
        ) : (
          <Typography color="error" sx={{ p: 2 }}>
            Finance statistics could not be loaded.
          </Typography>
        )}
      </Box>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Revenue Overview
            </Typography>
            {revenueLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1976d2"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#f44336"
                    strokeWidth={2}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Revenue by Department
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#1976d2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Invoices Table */}
      <Paper elevation={2} sx={{ width: "100%", overflow: "hidden" }}>
        <Box
          sx={{
            p: 3,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recent Invoices
          </Typography>
          <Button variant="contained">View All Invoices</Button>
        </Box>
        {invoicesLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Invoice ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Patient</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentInvoices?.map((invoice: { id: string; patientName: string; date: string; amount: number; status: "PAID" | "UNPAID" | "OVERDUE"; type: string }) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell sx={{ fontFamily: "monospace" }}>
                      {invoice.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{invoice.patientName}</TableCell>
                    <TableCell>
                      {new Date(invoice.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{invoice.type}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default FinanceDashboardPage;
