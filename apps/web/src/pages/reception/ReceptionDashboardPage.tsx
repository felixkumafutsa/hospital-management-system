import { Box, Button, Stack, Typography } from "@mui/material";
import { LocalHospital, Theaters } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import InvoicesPage from "../finance/InvoicesPage";

const ReceptionDashboardPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ width: "100%", p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Reception & Cashier
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Record payments and print customer receipts. Admissions and theater are view-only.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<LocalHospital />}
            onClick={() => navigate("/patients/admissions")}
          >
            Admissions
          </Button>
          <Button
            variant="outlined"
            startIcon={<Theaters />}
            onClick={() => navigate("/theater")}
          >
            Theater
          </Button>
        </Stack>
      </Box>
      <InvoicesPage />
    </Box>
  );
};

export default ReceptionDashboardPage;
