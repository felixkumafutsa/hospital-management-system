import React, { Suspense } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  TrendingUp,
  People,
  CalendarToday,
  MedicalServices,
  AttachMoney,
  PendingActions,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";

// Import all Recharts components normally - tree-shaking will handle code splitting automatically
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Healthcare color palette
const PRIMARY_COLOR = "#0EA5A4";
const SECONDARY_COLOR = "#14B8A6";
const BG_COLOR = "#F8FAFC";
const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#64748B";
const CHART_COLORS = ["#0EA5A4", "#14B8A6", "#3B82F6", "#F59E0B", "#EF4444"];

// Metric card component
const MetricCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendValue,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  trend: "up" | "down" | "neutral";
  trendValue: string;
}) => (
  <Card
    sx={{
      height: "100%",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
      },
    }}
  >
    <CardContent>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ color: TEXT_MUTED, fontWeight: 500, mb: 0.5 }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{ color: TEXT_PRIMARY, fontWeight: 700 }}
          >
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: "12px",
            backgroundColor: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ fontSize: 28, color }} />
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Chip
          size="small"
          icon={<TrendingUp sx={{ fontSize: 14 }} />}
          label={trendValue}
          sx={{
            backgroundColor:
              trend === "up"
                ? `${PRIMARY_COLOR}15`
                : trend === "down"
                  ? "#EF444415"
                  : "#F59E0B15",
            color:
              trend === "up"
                ? PRIMARY_COLOR
                : trend === "down"
                  ? "#EF4444"
                  : "#F59E0B",
            fontWeight: 600,
            "& .MuiChip-icon": {
              color: "inherit",
            },
          }}
        />
        <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
          vs last month
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

// Chart loading skeleton
const ChartSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
    <Skeleton
      variant="rectangular"
      width="100%"
      height={300}
      sx={{ borderRadius: "8px" }}
    />
  </Box>
);

const DashboardPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const response = await api.get("/dashboard/stats");
      return response.data;
    },
  });

  // Mock chart data (replace with actual API data in production)
  const patientGrowthData = [
    { month: "Jan", patients: 120, new: 30 },
    { month: "Feb", patients: 150, new: 40 },
    { month: "Mar", patients: 180, new: 35 },
    { month: "Apr", patients: 220, new: 50 },
    { month: "May", patients: 270, new: 45 },
    { month: "Jun", patients: 320, new: 60 },
  ];

  const revenueData = [
    { month: "Jan", revenue: 12000, expenses: 5000 },
    { month: "Feb", revenue: 15000, expenses: 6000 },
    { month: "Mar", revenue: 18000, expenses: 7000 },
    { month: "Apr", revenue: 22000, expenses: 8000 },
    { month: "May", revenue: 27000, expenses: 9000 },
    { month: "Jun", revenue: 32000, expenses: 10000 },
  ];

  const appointmentsData = [
    { day: "Mon", appointments: 15, consultations: 12 },
    { day: "Tue", appointments: 22, consultations: 18 },
    { day: "Wed", appointments: 18, consultations: 15 },
    { day: "Thu", appointments: 25, consultations: 20 },
    { day: "Fri", appointments: 20, consultations: 17 },
    { day: "Sat", appointments: 10, consultations: 8 },
  ];

  const departmentData = [
    { name: "General Medicine", value: 35 },
    { name: "Cardiology", value: 20 },
    { name: "Laboratory", value: 15 },
    { name: "Pediatrics", value: 18 },
    { name: "Others", value: 12 },
  ];

  const metrics = [
    {
      title: "Total Patients",
      value: stats?.totalPatients || 1250,
      icon: People,
      color: PRIMARY_COLOR,
      trend: "up" as const,
      trendValue: "+12.5%",
    },
    {
      title: "Patients Today",
      value: stats?.patientsToday || 45,
      icon: People,
      color: "#3B82F6",
      trend: "up" as const,
      trendValue: "+8.2%",
    },
    {
      title: "Appointments Today",
      value: stats?.appointmentsToday || 32,
      icon: CalendarToday,
      color: "#14B8A6",
      trend: "up" as const,
      trendValue: "+15.3%",
    },
    {
      title: "Consultations",
      value: stats?.consultationsToday || 28,
      icon: MedicalServices,
      color: "#8B5CF6",
      trend: "neutral" as const,
      trendValue: "+2.1%",
    },
    {
      title: "Total Revenue",
      value: `$${stats?.totalRevenue?.toLocaleString() || "89,500"}`,
      icon: AttachMoney,
      color: "#10B981",
      trend: "up" as const,
      trendValue: "+22.4%",
    },
    {
      title: "Pending Bills",
      value: stats?.pendingBills || 15,
      icon: PendingActions,
      color: "#F59E0B",
      trend: "down" as const,
      trendValue: "-5.8%",
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ color: TEXT_PRIMARY, fontWeight: 700, mb: 1 }}
        >
          Welcome back, Admin! 👋
        </Typography>
        <Typography variant="body1" sx={{ color: TEXT_MUTED }}>
          Here's what's happening with your clinic today.
        </Typography>
      </Box>

      {/* Metric Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid
            item
            key={metric.title}
            xs={12}
            sm={6}
            lg={4}
            xl={2}
            sx={{ minWidth: isMobile ? "100%" : "250px" }}
          >
            {isLoading ? (
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton
                    variant="text"
                    width="40%"
                    height={40}
                    sx={{ mb: 2 }}
                  />
                  <Skeleton variant="text" width="30%" />
                </CardContent>
              </Card>
            ) : (
              <MetricCard {...metric} />
            )}
          </Grid>
        ))}
      </Grid>

      {/* Analytics Charts Section */}
      <Grid container spacing={3}>
        {/* Patients Growth Chart */}
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(27,167,132,0.06)",
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ color: TEXT_PRIMARY, fontWeight: 600, mb: 3 }}
              >
                Patient Growth
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={patientGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke={TEXT_MUTED} />
                  <YAxis stroke={TEXT_MUTED} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="patients"
                    stroke={PRIMARY_COLOR}
                    strokeWidth={3}
                    dot={{ fill: PRIMARY_COLOR, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="new"
                    stroke={SECONDARY_COLOR}
                    strokeWidth={3}
                    dot={{ fill: SECONDARY_COLOR, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Revenue Analytics Chart */}
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(27,167,132,0.06)",
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ color: TEXT_PRIMARY, fontWeight: 600, mb: 3 }}
              >
                Revenue Analytics
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke={TEXT_MUTED} />
                  <YAxis stroke={TEXT_MUTED} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill={PRIMARY_COLOR}
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="#94A3B8"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Appointments Trend Chart */}
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(27,167,132,0.06)",
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ color: TEXT_PRIMARY, fontWeight: 600, mb: 3 }}
              >
                Appointments Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={appointmentsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke={TEXT_MUTED} />
                  <YAxis stroke={TEXT_MUTED} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="appointments"
                    stackId="1"
                    stroke={PRIMARY_COLOR}
                    fill={`${PRIMARY_COLOR}40`}
                  />
                  <Area
                    type="monotone"
                    dataKey="consultations"
                    stackId="1"
                    stroke={SECONDARY_COLOR}
                    fill={`${SECONDARY_COLOR}40`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Department Statistics Pie Chart */}
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(27,167,132,0.06)",
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ color: TEXT_PRIMARY, fontWeight: 600, mb: 3 }}
              >
                Department Statistics
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;