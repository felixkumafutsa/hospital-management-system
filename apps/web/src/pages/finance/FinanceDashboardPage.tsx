import React from "react";
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
  TrendingUp,
  TrendingDown,
  Receipt,
  AttachMoney,
  ShoppingCart,
  Science,
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
import MainLayout from "../../components/layout/MainLayout";
import { api } from "../../config/api";

interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

interface Invoice {
  id: string;
  patientName: string;
  date: string;
  amount: number;
  status: "PAID" | "UNPAID" | "OVERDUE";
  type: string;
}

const FinanceDashboardPage = () => {
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["revenue-data"],
    queryFn: async () => {
      const res = await api.get("/finance/revenue");
      return res.data.data as RevenueData[];
    },
  });

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["recent-invoices"],
    queryFn: async () => {
      const res = await api.get("/finance/invoices/recent");
      return res.data.invoices as Invoice[];
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["finance-stats"],
    queryFn: async () => {
      const res = await api.get("/finance/stats");
      return res.data;
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
    trend,
    trendValue,
    color,
  }: any) => (
    <Card elevation={2}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {value}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {trend === "up" ? (
                <TrendingUp
                  sx={{ color: "success.main", fontSize: 16, mr: 0.5 }}
                />
              ) : (
                <TrendingDown
                  sx={{ color: "error.main", fontSize: 16, mr: 0.5 }}
                />
              )}
              <Typography variant="body2" color="text.secondary">
                {trendValue} from last month
              </Typography>
            </Box>
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: color + "20" }}>
            <Icon sx={{ fontSize: 28, color }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
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
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            {statsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <StatCard
                title="Total Revenue"
                value={`$${stats?.totalRevenue?.toLocaleString() || "0"}`}
                icon={AttachMoney}
                trend="up"
                trendValue="+12.5%"
                color="#1976d2"
              />
            )}
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Consultations"
              value={stats?.totalConsultations || 0}
              icon={Receipt}
              trend="up"
              trendValue="+8.2%"
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Pharmacy Sales"
              value={`$${stats?.pharmacyRevenue?.toLocaleString() || "0"}`}
              icon={ShoppingCart}
              trend="up"
              trendValue="+15.3%"
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Lab Tests"
              value={stats?.labTestsCompleted || 0}
              icon={Science}
              trend="up"
              trendValue="+10.1%"
              color="#9c27b0"
            />
          </Grid>
        </Grid>

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
                <BarChart
                  data={[
                    { name: "Consultation", value: 4500 },
                    { name: "Pharmacy", value: 3200 },
                    { name: "Lab", value: 2100 },
                    { name: "Inpatient", value: 1800 },
                  ]}
                >
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
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Invoice ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentInvoices?.map((invoice) => (
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
                        ${invoice.amount.toFixed(2)}
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
    </MainLayout>
  );
};

export default FinanceDashboardPage;
