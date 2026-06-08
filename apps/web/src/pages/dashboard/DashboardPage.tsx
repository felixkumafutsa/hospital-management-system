import React from "react";
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
import { useAuth } from "../../contexts/AuthContext";
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

const DashboardPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Fetch dashboard stats from real API endpoints
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      // Fetch patients and visits from existing APIs
      const [patientsRes, visitsRes, financeStatsRes] = await Promise.all([
        api.get("/patients"),
        api.get("/visits"),
        api.get("/finance/stats").catch(() => ({ data: {} })), // Fallback if finance endpoint fails
      ]);

      const patients = patientsRes.data.patients || [];
      const visits = visitsRes.data.visits || [];
      const financeStats = financeStatsRes.data || {};

      // Calculate basic stats
      const totalPatients = patients.length;
      const totalVisits = visits.length;
      const pendingVisits = visits.filter(
        (v: any) => v.status === "PENDING",
      ).length;
      const completedVisits = visits.filter(
        (v: any) => v.status === "COMPLETED",
      ).length;

      const todayVisitCount = visits.filter((v: any) => {
        const visitDate = new Date(v.visitDate);
        const today = new Date();
        return visitDate.toDateString() === today.toDateString();
      }).length;

      return {
        totalPatients,
        totalVisits,
        pendingVisits,
        completedVisits,
        todayVisits: todayVisitCount,
        patientsToday: todayVisitCount,
        appointmentsToday: todayVisitCount,
        consultationsToday: completedVisits,
        totalRevenue: financeStats.totalRevenue || 0,
        pendingBills: financeStats.totalOutstanding || 0,
      };
    },
  });

  // Fetch real chart data from APIs
  const { data: revenueData = [] } = useQuery({
    queryKey: ["dashboardRevenueData"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/revenue");
        return res.data.data || [];
      } catch {
        return [];
      }
    },
  });

  // Fetch visits data to calculate appointments trend
  const { data: appointmentsData = [] } = useQuery({
    queryKey: ["dashboardAppointmentsTrend"],
    queryFn: async () => {
      try {
        const res = await api.get("/visits");
        const visits = res.data.visits || [];

        // Group visits by day of week
        const dayMap = new Map<
          string,
          { appointments: number; consultations: number }
        >();
        const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        daysOfWeek.forEach((day) => {
          dayMap.set(day, { appointments: 0, consultations: 0 });
        });

        visits.forEach((visit: any) => {
          const visitDate = new Date(visit.visitDate);
          const dayIndex = visitDate.getDay();
          const dayName = daysOfWeek[(dayIndex + 6) % 7]; // Convert JS day (0=Sun) to our format (0=Mon)

          const dayData = dayMap.get(dayName) || {
            appointments: 0,
            consultations: 0,
          };
          dayData.appointments++;
          if (visit.status === "COMPLETED") {
            dayData.consultations++;
          }
          dayMap.set(dayName, dayData);
        });

        return daysOfWeek.map((day) => ({
          day,
          appointments: dayMap.get(day)?.appointments || 0,
          consultations: dayMap.get(day)?.consultations || 0,
        }));
      } catch {
        return daysOfWeek.map((day) => ({
          day,
          appointments: 0,
          consultations: 0,
        }));
      }
    },
  });

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Fetch patient growth data (monthly)
  const { data: patientGrowthData = [] } = useQuery({
    queryKey: ["dashboardPatientGrowth"],
    queryFn: async () => {
      try {
        const res = await api.get("/patients");
        const patients = res.data.patients || [];

        // Group patients by month
        const monthMap = new Map<string, { patients: number; new: number }>();
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];

        // Initialize last 6 months
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = monthNames[date.getMonth()];
          monthMap.set(monthKey, { patients: 0, new: 0 });
        }

        // Count patients registered in each month
        patients.forEach((patient: any) => {
          const registrationDate = new Date(
            patient.registrationDate || patient.createdAt,
          );
          const monthKey = monthNames[registrationDate.getMonth()];
          if (monthMap.has(monthKey)) {
            const data = monthMap.get(monthKey)!;
            data.new++;
            data.patients++;
          }
        });

        // Calculate cumulative patient count
        let cumulativePatients = 0;
        return Array.from(monthMap.entries()).map(([month, data]) => {
          cumulativePatients += data.new;
          return {
            month,
            patients: cumulativePatients,
            new: data.new,
          };
        });
      } catch {
        return [];
      }
    },
  });

  // Fetch visit data to calculate department stats
  const { data: departmentData = [] } = useQuery({
    queryKey: ["dashboardDepartmentStats"],
    queryFn: async () => {
      try {
        const res = await api.get("/visits");
        const visits = res.data.visits || [];

        // Group visits by visit type (if available) or use generic department names
        const departmentMap = new Map<string, number>();

        visits.forEach((visit: any) => {
          const dept = visit.visitType || "General";
          departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1);
        });

        const departmentArray = Array.from(departmentMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Top 5 departments

        // Ensure we have at least 5 entries for the pie chart
        const defaultDepts = [
          { name: "General Medicine", value: 0 },
          { name: "Cardiology", value: 0 },
          { name: "Laboratory", value: 0 },
          { name: "Pediatrics", value: 0 },
          { name: "Others", value: 0 },
        ];

        departmentArray.forEach((dept) => {
          const index = defaultDepts.findIndex(
            (d) => d.name.toLowerCase() === dept.name.toLowerCase(),
          );
          if (index >= 0) {
            defaultDepts[index].value = dept.value;
          }
        });

        return defaultDepts;
      } catch {
        return [
          { name: "General Medicine", value: 0 },
          { name: "Cardiology", value: 0 },
          { name: "Laboratory", value: 0 },
          { name: "Pediatrics", value: 0 },
          { name: "Others", value: 0 },
        ];
      }
    },
  });

  const metrics = [
    {
      title: "Total Patients",
      value: stats?.totalPatients ?? 0,
      icon: People,
      color: PRIMARY_COLOR,
      trend: "up" as const,
      trendValue: "+12.5%",
    },
    {
      title: "Patients Today",
      value: stats?.patientsToday ?? 0,
      icon: People,
      color: "#3B82F6",
      trend: "up" as const,
      trendValue: "+8.2%",
    },
    {
      title: "Appointments Today",
      value: stats?.appointmentsToday ?? 0,
      icon: CalendarToday,
      color: "#14B8A6",
      trend: "up" as const,
      trendValue: "+15.3%",
    },
    {
      title: "Consultations",
      value: stats?.consultationsToday ?? 0,
      icon: MedicalServices,
      color: "#8B5CF6",
      trend: "neutral" as const,
      trendValue: "+2.1%",
    },
    {
      title: "Total Revenue",
      value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`,
      icon: AttachMoney,
      color: "#10B981",
      trend: "up" as const,
      trendValue: "+22.4%",
    },
    {
      title: "Pending Bills",
      value: stats?.pendingBills ?? 0,
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
          Welcome back, {user?.firstName || "User"}! 👋
        </Typography>
        <Typography variant="body1" sx={{ color: TEXT_MUTED }}>
          Here's what's happening with your clinic today.
        </Typography>
      </Box>

      {/* Metric Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, _index) => (
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
                    {departmentData.map((_entry, index) => (
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
