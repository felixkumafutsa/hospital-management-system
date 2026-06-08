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
  CircularProgress,
  alpha,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../services/api";

const PRIMARY_COLOR = "#0EA5A4";

const PrescriptionsPage = () => {
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["admin-prescriptions"],
    queryFn: async () => {
      const res = await api.get("/prescriptions");
      return res.data.prescriptions;
    },
  });

  return (
    <MainLayout>
      <Box sx={{ width: "100%" }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, mb: 1, color: "#0F172A" }}
        >
          Prescriptions Registry
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Track and manage all medication orders issued by the clinical team
        </Typography>

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
                    <TableCell sx={{ fontWeight: 600 }}>Medication</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Dosage</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Prescriber</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prescriptions?.map((p: any) => (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {p.patient?.firstName} {p.patient?.lastName}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: PRIMARY_COLOR }}
                        >
                          {p.medicationName}
                        </Typography>
                      </TableCell>
                      <TableCell>{p.dosage}</TableCell>
                      <TableCell>Dr. {p.prescriber?.lastName}</TableCell>
                      <TableCell>
                        <Chip
                          label={p.status}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor:
                              p.status === "DISPENSED"
                                ? alpha("#10B981", 0.1)
                                : alpha("#3B82F6", 0.1),
                            color:
                              p.status === "DISPENSED" ? "#10B981" : "#3B82F6",
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!prescriptions || prescriptions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                        <Typography color="text.secondary">
                          No prescriptions found in the registry.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default PrescriptionsPage;
