import React from "react";
import {
  Alert,
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
  CircularProgress,
} from "@mui/material";
import {
  People,
  CalendarToday,
  MedicalServices,
  AttachMoney,
  PendingActions,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { formatCurrency } from "../../utils/currency";
import ConsultationDrawer from "../../components/ConsultationDrawer";
import { useConsultationDrawerStore } from "../../stores/consultationDrawerStore";
import DutyRoster from "../../components/duty-roster/DutyRoster";

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
  trendValue,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
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
          label={trendValue}
          sx={{
            backgroundColor: `${color}15`,
            color,
            fontWeight: 600,
          }}
        />
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  useConsultationDrawerStore();

  // Fetch dashboard stats from real API endpoints
  const { data: stats, isLoading, isError: statsError } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const dateRange = {
        fromDate: startOfToday.toISOString(),
        toDate: startOfTomorrow.toISOString(),
      };
      const [patientsRes, visitsRes, todayVisitsRes, awaitingPaymentRes, completedVisitsRes, todayAppointmentsRes, financeStatsRes] = await Promise.all([
        api.get("/patients", { params: { limit: 1 } }),
        api.get("/visits", { params: { limit: 1 } }),
        api.get("/visits", { params: { ...dateRange, limit: 1 } }),
        api.get("/visits", { params: { ...dateRange, status: "AWAITING_PAYMENT", limit: 1 } }),
        api.get("/visits", { params: { ...dateRange, status: "COMPLETED", limit: 1 } }),
        api.get("/appointments", { params: { ...dateRange, limit: 100 } }),
        api.get("/finance/stats"),
      ]);
      const financeStats = financeStatsRes.data;

      return {
        totalPatients: patientsRes.data.total ?? patientsRes.data.patients?.length ?? 0,
        totalVisits: visitsRes.data.total ?? visitsRes.data.visits?.length ?? 0,
        todayVisits: todayVisitsRes.data.total ?? 0,
        patientsToday: todayVisitsRes.data.total ?? 0,
        appointmentsToday: todayAppointmentsRes.data.total ?? todayAppointmentsRes.data.appointments?.length ?? 0,
        consultationsToday:
          Number(awaitingPaymentRes.data.total ?? 0) +
          Number(completedVisitsRes.data.total ?? 0),
        totalRevenue: Number(financeStats.totalRevenue ?? 0),
        pendingBills: Number(financeStats.totalOutstanding ?? 0),
      };
    },
  });

  // Fetch department revenue breakdown
  const { data: departmentRevenueData = [], isLoading: revenueLoading, isError: departmentRevenueError } = useQuery({
    queryKey: ["department-revenue"],
    queryFn: async () => {
      const res = await api.get("/finance/department-revenue");
      const data = res.data?.data ?? res.data;
      if (!Array.isArray(data)) throw new Error("Department revenue response was invalid");
      return data;
    },
  });

  const departmentColors: { [key: string]: string } = {
    CONSULTATION: "#8884d8",
    PHARMACY: "#82ca9d",
    LABORATORY: "#ffc658",
    PROCEDURE: "#ff8042",
    'OTHER_SERVICES': "#00C49F",
  };

  const transformedData = departmentRevenueData.reduce((acc: any, monthData: any) => {
    const month = monthData.month;
    let monthEntry = acc.find((entry: any) => entry.month === month);
    if (!monthEntry) {
      monthEntry = { month };
      acc.push(monthEntry);
    }
    monthData.departments.forEach((dept: any) => {
      monthEntry[dept.name] = dept.revenue;
    });
    return acc;
  }, []);

  const departmentNames = Array.from(
    new Set(
      departmentRevenueData.flatMap((monthData: any) =>
        monthData.departments.map((dept: any) => dept.name)
      )
    )
  );

  // Fetch real chart data from APIs
  const { data: revenueData = [], isLoading: revenueChartLoading, isError: revenueChartError } = useQuery({
    queryKey: ["dashboardRevenueData"],
    queryFn: async () => {
      const res = await api.get("/finance/revenue");
      const data = res.data?.data ?? res.data;
      if (!Array.isArray(data)) throw new Error("Revenue response was invalid");
      return data;
    },
  });

  // Fetch visits data to calculate appointments trend
  const { data: appointmentsData = [], isError: appointmentsError } = useQuery({
    queryKey: ["dashboardAppointmentsTrend"],
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 6);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const params = { fromDate: start.toISOString(), toDate: end.toISOString(), limit: 100 };
      const fetchAll = async (path: string, key: "appointments" | "visits") => {
        const firstPage = await api.get(path, { params: { ...params, offset: 0 } });
        const records = [...(firstPage.data[key] ?? [])];
        const total = Number(firstPage.data.total ?? records.length);
        for (let offset = records.length; offset < total; offset += params.limit) {
          const page = await api.get(path, { params: { ...params, offset } });
          const pageRecords = page.data[key] ?? [];
          if (pageRecords.length === 0) break;
          records.push(...pageRecords);
        }
        return records;
      };
      const [appointments, visits] = await Promise.all([
        fetchAll("/appointments", "appointments"),
        fetchAll("/visits", "visits"),
      ]);
      const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return {
          date,
          day: date.toLocaleDateString(undefined, { weekday: "short" }),
          appointments: 0,
          consultations: 0,
        };
      });
      appointments.forEach((appointment: { appointmentDate: string }) => {
        const date = new Date(appointment.appointmentDate);
        const day = days.find((item) => item.date.toDateString() === date.toDateString());
        if (day) day.appointments += 1;
      });
      visits.forEach((visit: { visitDate: string; status: string }) => {
        const date = new Date(visit.visitDate);
        const day = days.find((item) => item.date.toDateString() === date.toDateString());
        if (day && ["AWAITING_PAYMENT", "COMPLETED"].includes(visit.status)) {
          day.consultations += 1;
        }
      });
      return days.map(({ day, appointments: appointmentCount, consultations }) => ({
        day,
        appointments: appointmentCount,
        consultations,
      }));
    },
  });

  // Fetch patient growth data (monthly)
  const { data: patientGrowthData = [], isError: patientGrowthError } = useQuery({
    queryKey: ["dashboardPatientGrowth"],
    queryFn: async () => {
      const pageSize = 100;
      const firstPage = await api.get("/patients", { params: { limit: pageSize, offset: 0 } });
      const patients = [...(firstPage.data.patients ?? [])];
      const total = Number(firstPage.data.total ?? patients.length);
      for (let offset = patients.length; offset < total; offset += pageSize) {
        const page = await api.get("/patients", { params: { limit: pageSize, offset } });
        const pagePatients = page.data.patients ?? [];
        if (pagePatients.length === 0) break;
        patients.push(...pagePatients);
      }

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

        // Initialize last six months with current system totals and registrations.
        const now = new Date();
        const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const olderPatients = patients.filter((patient: any) => {
          const registeredAt = new Date(patient.registrationDate || patient.createdAt);
          return registeredAt < firstMonth;
        }).length;
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          monthMap.set(monthKey, { patients: 0, new: 0 });
        }

        patients.forEach((patient: any) => {
          const registrationDate = new Date(
            patient.registrationDate || patient.createdAt,
          );
          const monthKey = `${monthNames[registrationDate.getMonth()]} ${registrationDate.getFullYear()}`;
          if (monthMap.has(monthKey)) {
            const data = monthMap.get(monthKey)!;
            data.new++;
            data.patients++;
          }
        });

        // Calculate cumulative patient count
        let cumulativePatients = olderPatients;
        return Array.from(monthMap.entries()).map(([month, data]) => {
          cumulativePatients += data.new;
          return {
            month,
            patients: cumulativePatients,
            new: data.new,
          };
        });
    },
  });

  const latestDepartmentRevenue = departmentRevenueData[departmentRevenueData.length - 1];
  const departmentData: { name: string; value: number }[] = latestDepartmentRevenue?.departments.map(
    (department: { name: string; revenue: number }) => ({
      name: department.name,
      value: Number(department.revenue),
    }),
  ) ?? [];

  const metrics = [
    {
      title: "Total Patients",
      value: stats?.totalPatients ?? 0,
      icon: People,
      color: PRIMARY_COLOR,
      trendValue: "All registrations",
    },
    {
      title: "Patients Seen Today",
      value: stats?.patientsToday ?? 0,
      icon: People,
      color: "#3B82F6",
      trendValue: "Visits today",
    },
    {
      title: "Appointments Today",
      value: stats?.appointmentsToday ?? 0,
      icon: CalendarToday,
      color: "#14B8A6",
      trendValue: "Scheduled today",
    },
    {
      title: "Completed Consultations Today",
      value: stats?.consultationsToday ?? 0,
      icon: MedicalServices,
      color: "#8B5CF6",
      trendValue: "Completed visits today",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue ?? 0),
      icon: AttachMoney,
      color: "#10B981",
      trendValue: "Collected to date",
    },
    {
      title: "Pending Bills",
      value: stats?.pendingBills ?? 0,
      icon: PendingActions,
      color: "#F59E0B",
      trendValue: "Outstanding balance",
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <ConsultationDrawer />
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

      {(statsError || departmentRevenueError || revenueChartError || appointmentsError || patientGrowthError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Some dashboard data could not be loaded. Charts will not show placeholder values; check your connection and refresh.
        </Alert>
      )}

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
              {revenueChartLoading ? <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box> : revenueData.length ? (
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
                </BarChart>
                </ResponsiveContainer>
              ) : <Typography color="text.secondary">No payment revenue has been recorded in the displayed period.</Typography>}
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
              {appointmentsData.length ? <ResponsiveContainer width="100%" height={300}>
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
              </ResponsiveContainer> : <Typography color="text.secondary">No appointment or completed consultation data is available for the past week.</Typography>}
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
                Department Revenue · {latestDepartmentRevenue?.month ?? "latest month"}
              </Typography>
              {departmentData.length ? <ResponsiveContainer width="100%" height={300}>
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
                    {departmentData.map((_entry: { name: string; value: number }, index: number) => (
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
              </ResponsiveContainer> : <Typography color="text.secondary">No department revenue has been recorded for the latest month.</Typography>}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {user?.role?.name === "ADMINISTRATOR" && (
        <Grid item xs={12} sx={{ mt: 4 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Revenue by Department
            </Typography>
            {revenueLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : departmentRevenueError ? (
              <Alert severity="error">Department revenue data could not be loaded.</Alert>
            ) : transformedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={transformedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  {departmentNames.map((dept: any) => (
                    <Line
                      key={dept}
                      type="monotone"
                      dataKey={dept}
                      stroke={departmentColors[dept] || "#000000"}
                      strokeWidth={2}
                      name={dept}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : <Typography color="text.secondary">No department revenue has been recorded in the displayed period.</Typography>}
          </Paper>
        </Grid>
      )}

      <Grid item xs={12} sx={{ mt: 4 }}>
        <DutyRoster />
      </Grid>
    </Box>
  );
};

export default DashboardPage;