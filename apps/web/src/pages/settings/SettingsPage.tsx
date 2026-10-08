import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { getLabTests } from "../../services/api";

const SettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const rawRole = typeof user?.role === "object" ? user.role?.name : user?.role;
  const isAdmin = rawRole?.toUpperCase() === "ADMINISTRATOR";
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize profile data from user object
  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
    twoFactorAuth: false,
  });
  const [consultationFee, setConsultationFee] = useState("");
  const [labPrices, setLabPrices] = useState<Record<string, string>>({});

  const { data: pricingData, isLoading: pricingLoading, error: pricingError } = useQuery({
    queryKey: ["system-pricing"],
    queryFn: async () => (await api.get("/settings/pricing")).data.settings,
    enabled: isAdmin,
  });
  const { data: labTests = [], isLoading: labTestsLoading } = useQuery({
    queryKey: ["settings-lab-tests"],
    queryFn: async () => (await getLabTests()).data.tests || [],
    enabled: isAdmin,
  });

  useEffect(() => {
    if (pricingData?.consultationFee != null) {
      setConsultationFee(String(pricingData.consultationFee));
    }
  }, [pricingData]);

  const saveConsultationFee = useMutation({
    mutationFn: async () => api.put("/settings/pricing/consultation", {
      consultationFee: Number(consultationFee),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system-pricing"] }),
  });
  const saveLabPrice = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) =>
      api.put(`/lab/tests/${id}/price`, { price }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings-lab-tests"] }),
  });

  const handleProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({
      ...profile,
      [event.target.name]: event.target.value,
    });
    setHasChanges(true);
  };

  const handleSettingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [event.target.name]: event.target.checked,
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    // In a real app, this would send profile and settings to an API
    console.log("Saving profile:", profile);
    console.log("Saving settings:", settings);
    setSaveSuccess(true);
    setHasChanges(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCancel = () => {
    // Reset to original values
    setProfile({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setSettings({
      emailNotifications: true,
      smsNotifications: false,
      darkMode: false,
      twoFactorAuth: false,
    });
    setHasChanges(false);
  };

  return (
      <Box>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
          Settings
        </Typography>

        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Settings saved successfully!
          </Alert>
        )}

        <Grid container spacing={3}>
          {isAdmin && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: 1 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Clinic Pricing
                </Typography>
                {pricingError && <Alert severity="error" sx={{ mb: 2 }}>Unable to load pricing settings.</Alert>}
                <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Consultation Fee (MWK)"
                      value={consultationFee}
                      onChange={(event) => setConsultationFee(event.target.value)}
                      inputProps={{ min: 1, step: "0.01" }}
                      disabled={pricingLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      variant="contained"
                      onClick={() => saveConsultationFee.mutate()}
                      disabled={saveConsultationFee.isPending || Number(consultationFee) <= 0}
                    >
                      {saveConsultationFee.isPending ? <CircularProgress size={20} /> : "Save Fee"}
                    </Button>
                  </Grid>
                </Grid>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Laboratory Test Prices
                </Typography>
                {labTestsLoading ? <CircularProgress size={24} /> : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Test</TableCell>
                          <TableCell>Code</TableCell>
                          <TableCell>Price (MWK)</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {labTests.map((test: { id: string; name: string; code: string; price: number | string }) => (
                          <TableRow key={test.id}>
                            <TableCell>{test.name}</TableCell>
                            <TableCell>{test.code}</TableCell>
                            <TableCell sx={{ width: 180 }}>
                              <TextField
                                size="small"
                                type="number"
                                value={labPrices[test.id] ?? String(Number(test.price))}
                                onChange={(event) => setLabPrices((current) => ({ ...current, [test.id]: event.target.value }))}
                                inputProps={{ min: 0.01, step: "0.01" }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                onClick={() => saveLabPrice.mutate({ id: test.id, price: Number(labPrices[test.id] ?? test.price) })}
                                disabled={saveLabPrice.isPending || Number(labPrices[test.id] ?? test.price) <= 0}
                              >
                                Save
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                {saveConsultationFee.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Consultation fee saved.</Alert>}
                {saveLabPrice.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Lab price saved.</Alert>}
                {(saveConsultationFee.isError || saveLabPrice.isError) && <Alert severity="error" sx={{ mt: 2 }}>Could not save clinic pricing.</Alert>}
              </Paper>
            </Grid>
          )}
          {/* Profile Settings */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 4, borderRadius: "16px" }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Profile Settings
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleProfileChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleProfileChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Notification Settings */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 4, borderRadius: "16px" }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Notification Settings
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={handleSettingChange}
                      name="emailNotifications"
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smsNotifications}
                      onChange={handleSettingChange}
                      name="smsNotifications"
                    />
                  }
                  label="SMS Notifications"
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Security
              </Typography>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twoFactorAuth}
                      onChange={handleSettingChange}
                      name="twoFactorAuth"
                    />
                  }
                  label="Two-Factor Authentication"
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Appearance
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.darkMode}
                    onChange={handleSettingChange}
                    name="darkMode"
                  />
                }
                label="Dark Mode"
              />

              <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={!hasChanges}
                  sx={{
                    borderColor: "#64748B",
                    color: "#64748B",
                    "&:hover": { borderColor: "#475569", color: "#475569" },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={!hasChanges}
                  sx={{
                    bgcolor: "#0EA5A4",
                    "&:hover": { bgcolor: "#0c8c8b" },
                    "&:disabled": { bgcolor: "#94A3B8" },
                  }}
                >
                  Save Settings
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
  );
};

export default SettingsPage;
