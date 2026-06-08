import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  alpha,
} from "@mui/material";
import MainLayout from "../../components/layout/MainLayout";

const LabTestsPage = () => {
  const tests = [
    {
      id: "1",
      patient: "John Doe",
      test: "Full Blood Count",
      date: "2024-05-20",
      status: "COMPLETED",
      priority: "NORMAL",
    },
    {
      id: "2",
      patient: "Jane Smith",
      test: "Malaria Parasites",
      date: "2024-05-21",
      status: "PENDING",
      priority: "URGENT",
    },
    {
      id: "3",
      patient: "Robert Brown",
      test: "Lipid Profile",
      date: "2024-05-21",
      status: "IN_PROGRESS",
      priority: "NORMAL",
    },
  ];

  return (
    <MainLayout>
      <Box sx={{ width: "100%" }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Lab Investigations
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Monitor statuses of all requested laboratory tests
        </Typography>

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
                  <TableCell sx={{ fontWeight: 600 }}>Patient Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Test Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Requested Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {test.patient}
                    </TableCell>
                    <TableCell>{test.test}</TableCell>
                    <TableCell>{test.date}</TableCell>
                    <TableCell>
                      <Chip
                        label={test.priority}
                        size="small"
                        variant="outlined"
                        color={test.priority === "URGENT" ? "error" : "default"}
                        sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={test.status.replace("_", " ")}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor:
                            test.status === "COMPLETED"
                              ? alpha("#10B981", 0.1)
                              : test.status === "PENDING"
                                ? alpha("#F59E0B", 0.1)
                                : alpha("#3B82F6", 0.1),
                          color:
                            test.status === "COMPLETED"
                              ? "#10B981"
                              : test.status === "PENDING"
                                ? "#F59E0B"
                                : "#3B82F6",
                        }}
                      />
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

export default LabTestsPage;
