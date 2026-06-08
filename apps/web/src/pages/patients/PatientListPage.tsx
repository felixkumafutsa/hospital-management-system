import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Drawer,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Swal from "sweetalert2";
import {
  Add as AddIcon,
  Visibility,
  Edit,
  Search,
  Close,
  ArrowBack,
  ArrowForward,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  isActive: boolean;
  allergies: string[];
  createdAt: string;
}

const PatientListPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [editActiveStep, setEditActiveStep] = useState(0);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const navigate = useNavigate();

  // Patient registration form state
  const steps = [
    "Personal Information",
    "Contact Details",
    "Medical Information",
    "Review & Submit",
  ];
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const genderOptions = ["FEMALE", "MALE", "OTHER"];
  const commonAllergies = ["Penicillin", "Peanuts", "Latex", "Pollen", "Dust"];

  interface PatientFormData {
    nationalId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email: string;
    address: string;
    nextOfKinName: string;
    nextOfKinPhone: string;
    nextOfKinRelation: string;
    bloodGroup: string;
    allergies: string[];
    insuranceProvider: string;
    insuranceNumber: string;
  }

  const initialFormData: PatientFormData = {
    nationalId: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    nextOfKinRelation: "",
    bloodGroup: "",
    allergies: [],
    insuranceProvider: "",
    insuranceNumber: "",
  };

  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [newAllergy, setNewAllergy] = useState("");

  // Edit patient form state
  const [editFormData, setEditFormData] =
    useState<PatientFormData>(initialFormData);
  const [editNewAllergy, setEditNewAllergy] = useState("");

  const handleOpenEditDrawer = (patient: Patient) => {
    const p = patient as any; // Fix TypeScript errors by asserting type to any
    setEditingPatient(patient);
    // Format date for input field (YYYY-MM-DD)
    const formattedDate = patient.dateOfBirth
      ? new Date(patient.dateOfBirth).toISOString().split("T")[0]
      : "";
    setEditFormData({
      nationalId: p.nationalId || "",
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: formattedDate,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: p.address || "",
      nextOfKinName: p.nextOfKinName || "",
      nextOfKinPhone: p.nextOfKinPhone || "",
      nextOfKinRelation: p.nextOfKinRelation || "",
      bloodGroup: p.bloodGroup || "",
      allergies: p.allergies || [],
      insuranceProvider: p.insuranceProvider || "",
      insuranceNumber: p.insuranceNumber || "",
    });
    setEditActiveStep(0);
    setEditDrawerOpen(true);
  };

  const handleCloseEditDrawer = () => {
    setEditDrawerOpen(false);
    setEditingPatient(null);
    setEditFormData(initialFormData);
  };

  const handleEditNext = () => {
    setEditActiveStep((prev) => prev + 1);
  };

  const handleEditBack = () => {
    setEditActiveStep((prev) => prev - 1);
  };

  const handleEditInputChange = (
    e:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | any,
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEditAllergy = () => {
    if (editNewAllergy && !editFormData.allergies.includes(editNewAllergy)) {
      setEditFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, editNewAllergy],
      }));
      setEditNewAllergy("");
    }
  };

  const handleRemoveEditAllergy = (allergyToRemove: string) => {
    setEditFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((a) => a !== allergyToRemove),
    }));
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleInputChange = (
    e:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | any,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAllergy = () => {
    if (newAllergy && !formData.allergies.includes(newAllergy)) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy],
      }));
      setNewAllergy("");
    }
  };

  const handleRemoveAllergy = (allergyToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((a) => a !== allergyToRemove),
    }));
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setActiveStep(0);
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    try {
      // Ensure dateOfBirth is properly sent as a date string
      const patientData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth).toISOString()
          : undefined,
      };
      await api.post("/patients", patientData);
      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Patient registered successfully!",
        confirmButtonColor: "#0EA5A4",
      });
      handleCloseDrawer();
      window.location.reload(); // Refresh to show new patient
    } catch (error) {
      console.error("Error registering patient:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to register patient. Please try again.",
        confirmButtonColor: "#0EA5A4",
      });
    }
  };

  const handleEditSubmit = async () => {
    try {
      if (!editingPatient) return;
      // Ensure dateOfBirth is properly sent as a date string
      const patientData = {
        ...editFormData,
        dateOfBirth: editFormData.dateOfBirth
          ? new Date(editFormData.dateOfBirth).toISOString()
          : undefined,
      };
      await api.put(`/patients/${editingPatient.id}`, patientData);
      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Patient updated successfully!",
        confirmButtonColor: "#0EA5A4",
      });
      handleCloseEditDrawer();
      window.location.reload(); // Refresh to show updated patient
    } catch (error) {
      console.error("Error updating patient:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update patient. Please try again.",
        confirmButtonColor: "#0EA5A4",
      });
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Personal Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="National ID"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="date"
                label="Date of Birth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  label="Gender"
                >
                  {genderOptions.map((gender) => (
                    <MenuItem key={gender} value={gender}>
                      {gender.charAt(0) + gender.slice(1).toLowerCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1: // Contact Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="email"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Next of Kin Name"
                name="nextOfKinName"
                value={formData.nextOfKinName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Next of Kin Phone"
                name="nextOfKinPhone"
                value={formData.nextOfKinPhone}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Relationship to Next of Kin"
                name="nextOfKinRelation"
                value={formData.nextOfKinRelation}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        );

      case 2: // Medical Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Blood Group</InputLabel>
                <Select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  label="Blood Group"
                >
                  {bloodGroups.map((bg) => (
                    <MenuItem key={bg} value={bg}>
                      {bg}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Allergies
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                {formData.allergies.map((allergy) => (
                  <Chip
                    key={allergy}
                    label={allergy}
                    onDelete={() => handleRemoveAllergy(allergy)}
                  />
                ))}
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  label="Add allergy"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                />
                <datalist id="common-allergies">
                  {commonAllergies.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
                <Button variant="outlined" onClick={handleAddAllergy}>
                  Add
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Insurance Provider"
                name="insuranceProvider"
                value={formData.insuranceProvider}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Insurance Number"
                name="insuranceNumber"
                value={formData.insuranceNumber}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        );

      case 3: // Review & Submit
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Patient Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>
                  <strong>Name:</strong> {formData.firstName}{" "}
                  {formData.lastName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>
                  <strong>DOB:</strong> {formData.dateOfBirth}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>
                  <strong>Gender:</strong> {formData.gender}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>
                  <strong>Phone:</strong> {formData.phone}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>Email:</strong> {formData.email}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>Address:</strong> {formData.address}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>
                  <strong>Next of Kin:</strong> {formData.nextOfKinName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>
                  <strong>Next of Kin Phone:</strong> {formData.nextOfKinPhone}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>Blood Group:</strong>{" "}
                  {formData.bloodGroup || "Not specified"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>Allergies:</strong>{" "}
                  {formData.allergies.length > 0
                    ? formData.allergies.join(", ")
                    : "None"}
                </Typography>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
              >
                Submit Registration
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const response = await api.get("/patients");
      return response.data.patients as Patient[];
    },
  });

  const filteredPatients =
    patients?.filter(
      (patient) =>
        `${patient.firstName} ${patient.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        patient.patientNumber.includes(searchTerm),
    ) || [];

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Patients</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDrawerOpen(true)}
          sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
        >
          Register New Patient
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          placeholder="Search patients by name, email, phone, or ID..."
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Patient ID</strong>
              </TableCell>
              <TableCell>
                <strong>Patient Name</strong>
              </TableCell>
              <TableCell>
                <strong>Contact</strong>
              </TableCell>
              <TableCell>
                <strong>Date of Birth</strong>
              </TableCell>
              <TableCell>
                <strong>Gender</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading patients...
                </TableCell>
              </TableRow>
            ) : filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No patients found
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((patient) => (
                  <TableRow key={patient.id} hover>
                    <TableCell>{patient.patientNumber}</TableCell>
                    <TableCell>
                      {patient.firstName} {patient.lastName}
                    </TableCell>
                    <TableCell>
                      <div>{patient.email}</div>
                      <div style={{ fontSize: "0.875rem", color: "#666" }}>
                        {patient.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(patient.dateOfBirth).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    <TableCell>
                      <Chip
                        label={patient.isActive ? "ACTIVE" : "INACTIVE"}
                        color={patient.isActive ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          size="small"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDrawer(patient)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPatients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Slide-in drawer for patient registration */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { width: { xs: "100%", md: "600px" }, p: 4 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Register New Patient
          </Typography>
          <IconButton onClick={handleCloseDrawer}>
            <Close />
          </IconButton>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}

        {activeStep < steps.length - 1 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForward />}
              sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
            >
              Next
            </Button>
          </Box>
        )}
      </Drawer>

      {/* Slide-in drawer for editing patient */}
      <Drawer
        anchor="right"
        open={editDrawerOpen}
        onClose={handleCloseEditDrawer}
        PaperProps={{
          sx: { width: { xs: "100%", md: "600px" }, p: 4 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Edit Patient
          </Typography>
          <IconButton onClick={handleCloseEditDrawer}>
            <Close />
          </IconButton>
        </Box>

        <Stepper activeStep={editActiveStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Render edit step content */}
        {editActiveStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={editFormData.firstName}
                onChange={handleEditInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={editFormData.lastName}
                onChange={handleEditInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="National ID"
                name="nationalId"
                value={editFormData.nationalId}
                onChange={handleEditInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={editFormData.dateOfBirth}
                onChange={handleEditInputChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={editFormData.gender}
                  label="Gender"
                  onChange={handleEditInputChange}
                >
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={editFormData.phone}
                onChange={handleEditInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleEditInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={editFormData.address}
                onChange={handleEditInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        )}

        {editActiveStep === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Next of Kin Name"
                name="nextOfKinName"
                value={editFormData.nextOfKinName}
                onChange={handleEditInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Next of Kin Phone"
                name="nextOfKinPhone"
                value={editFormData.nextOfKinPhone}
                onChange={handleEditInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Next of Kin Relation"
                name="nextOfKinRelation"
                value={editFormData.nextOfKinRelation}
                onChange={handleEditInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Blood Group</InputLabel>
                <Select
                  name="bloodGroup"
                  value={editFormData.bloodGroup}
                  label="Blood Group"
                  onChange={handleEditInputChange}
                >
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="AB+">AB+</MenuItem>
                  <MenuItem value="AB-">AB-</MenuItem>
                  <MenuItem value="O+">O+</MenuItem>
                  <MenuItem value="O-">O-</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {editActiveStep === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Allergies
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add Allergy"
                  value={editNewAllergy}
                  onChange={(e) => setEditNewAllergy(e.target.value)}
                />
                <Button variant="outlined" onClick={handleAddEditAllergy}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {editFormData.allergies.map((allergy) => (
                  <Chip
                    key={allergy}
                    label={allergy}
                    onDelete={() => handleRemoveEditAllergy(allergy)}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Insurance Provider"
                name="insuranceProvider"
                value={editFormData.insuranceProvider}
                onChange={handleEditInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Insurance Number"
                name="insuranceNumber"
                value={editFormData.insuranceNumber}
                onChange={handleEditInputChange}
              />
            </Grid>
          </Grid>
        )}

        {editActiveStep < steps.length - 1 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              disabled={editActiveStep === 0}
              onClick={handleEditBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleEditNext}
              endIcon={<ArrowForward />}
              sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
            >
              Next
            </Button>
          </Box>
        )}

        {editActiveStep === steps.length - 1 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button onClick={handleEditBack} startIcon={<ArrowBack />}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleEditSubmit}
              sx={{ bgcolor: "#0EA5A4", "&:hover": { bgcolor: "#0c8c8b" } }}
            >
              Update Patient
            </Button>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default PatientListPage;
