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
  CircularProgress,
  IconButton,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  Visibility,
  Assignment,
  TrendingUp,
  History,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../services/api";

const PRIMARY_COLOR = "#0EA5A4";

const ConsultationsPage = () => {
  const { data: consultations, isLoading } = useQuery({
    queryKey: ["admin-consultations"],
    queryFn: async () => {
      const res = await api.get("/visits");
      return res.data.visits;
    },
  });

  const stats = {
    total: consultations?.length || 0,
    completed:
      consultations?.filter((c: any) => c.status === "COMPLETED").length || 0,
    pending:
      consultations?.filter((c: any) => c.status === "PENDING").length || 0,
  };

  return (
    <MainLayout>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, mb: 1, color: "#0F172A" }}
          >
            Consultations Oversight
          </Typography>
          <Typography color="text.secondary">
            Monitor and review all patient clinical encounters across
            departments
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              label: "Total Visits",
              value: stats.total,
              icon: <Assignment />,
              color: PRIMARY_COLOR,
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: <TrendingUp />,
              color: "#10B981",
            },
            {
              label: "Pending Review",
              value: stats.pending,
              icon: <History />,
              color: "#F59E0B",
            },
          ].map((stat, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Paper
                sx={{
                  p: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  borderRadius: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: alpha(stat.color, 0.1),
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper
          sx={{
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        >
          {isLoading ? (
            <Box sx={{ p: 8, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Practitioner</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Diagnosis/Reason
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {consultations?.map((item: any) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        {new Date(item.visitDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.patient?.firstName} {item.patient?.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        Dr. {item.doctor?.lastName || "Staff"}
                      </TableCell>
                      <TableCell>
                        {item.reason || "General Consultation"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor:
                              item.status === "COMPLETED"
                                ? alpha("#10B981", 0.1)
                                : alpha("#F59E0B", 0.1),
                            color:
                              item.status === "COMPLETED"
                                ? "#10B981"
                                : "#F59E0B",
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Medical Record">
                          <IconButton
                            size="small"
                            sx={{ color: PRIMARY_COLOR }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
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

export default ConsultationsPage;
