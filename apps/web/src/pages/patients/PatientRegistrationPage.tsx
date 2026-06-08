import React, { useState } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from "@mui/material";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import Swal from "sweetalert2";

const steps = [
  "Personal Information",
  "Contact Details",
  "Medical Information",
  "Review & Submit",
];

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

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genderOptions = ["FEMALE", "MALE", "OTHER"];
const commonAllergies = ["Penicillin", "Peanuts", "Latex", "Pollen", "Dust"];

const PatientRegistrationPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [newAllergy, setNewAllergy] = useState("");
  const queryClient = useQueryClient();

  const createPatientMutation = useMutation({
    mutationFn: async (data: Partial<PatientFormData>) => {
      const response = await api.post("/patients", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

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

  const handleSubmit = async () => {
    try {
      await createPatientMutation.mutateAsync(formData);
      setActiveStep(0);
      setFormData(initialFormData);
      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Patient registered successfully!",
        confirmButtonColor: "#0EA5A4",
      });
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
              Patient Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Full Name</Typography>
                <Typography>
                  {formData.firstName} {formData.lastName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Date of Birth</Typography>
                <Typography>{formData.dateOfBirth}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Gender</Typography>
                <Typography>{formData.gender}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Phone</Typography>
                <Typography>{formData.phone}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Address</Typography>
                <Typography>{formData.address}</Typography>
              </Grid>
              {formData.allergies.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Allergies</Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}
                  >
                    {formData.allergies.map((allergy) => (
                      <Chip key={allergy} label={allergy} color="error" />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: "100%", mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Register New Patient
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent()}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={(createPatientMutation as any).isLoading}
              endIcon={<ArrowForward />}
            >
              Submit
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForward />}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default PatientRegistrationPage;
