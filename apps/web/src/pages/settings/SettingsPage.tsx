import React, { useState } from "react";
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
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

const SettingsPage = () => {
  const { user } = useAuth();
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
