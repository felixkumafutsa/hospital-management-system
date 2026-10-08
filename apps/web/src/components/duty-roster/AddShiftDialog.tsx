import {
  Button,
  Drawer,
  TextField,
  Box,
  Typography,
  IconButton,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import * as yup from "yup";
import { useDutyRosterStore } from "../../stores/dutyRosterStore";
import { User, getUsers } from "../../services/userService";
import { useEffect, useState } from "react";

interface AddShiftDialogProps {
  open: boolean;
  onClose: () => void;
}

const validationSchema = yup.object({
  staffId: yup.string().required("Staff is required"),
  startTime: yup.date().required("Start time is required"),
  endTime: yup.date()
    .required("End time is required")
    .min(yup.ref('startTime'), "End time must be after start time"),
});

const AddShiftDialog = ({ open, onClose }: AddShiftDialogProps) => {
  const { addDutyRoster } = useDutyRosterStore();
  const [staff, setStaff] = useState<User[]>([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const users = await getUsers();
        // Ensure we always set an array, even if API returns unexpected format
        setStaff(Array.isArray(users) ? users : []);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
        setStaff([]); // Set empty array on error to prevent .map() crash
      }
    };
    if (open) {
      fetchStaff();
    }
  }, [open]);

  const formik = useFormik({
    initialValues: {
      staffId: "",
      startTime: "",
      endTime: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      // Convert datetime-local values to ISO 8601 strings for backend Zod validation
      const formattedValues = {
        ...values,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
      };
      addDutyRoster(formattedValues);
      formik.resetForm();
      onClose();
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}>
      <Box sx={{ width: 400, padding: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h6">Add New Shift</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <form onSubmit={formik.handleSubmit}>
          <TextField
            select
            autoFocus
            margin="dense"
            id="staffId"
            name="staffId"
            label="Select Staff"
            fullWidth
            variant="standard"
            value={formik.values.staffId}
            onChange={formik.handleChange}
            error={formik.touched.staffId && Boolean(formik.errors.staffId)}
            helperText={formik.touched.staffId && formik.errors.staffId}
            sx={{ mb: 2 }}
          >
            {Array.isArray(staff) && staff.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            id="startTime"
            name="startTime"
            label="Start Time"
            type="datetime-local"
            fullWidth
            variant="standard"
            value={formik.values.startTime}
            onChange={formik.handleChange}
            error={formik.touched.startTime && Boolean(formik.errors.startTime)}
            helperText={formik.touched.startTime && formik.errors.startTime}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="endTime"
            name="endTime"
            label="End Time"
            type="datetime-local"
            fullWidth
            variant="standard"
            value={formik.values.endTime}
            onChange={formik.handleChange}
            error={formik.touched.endTime && Boolean(formik.errors.endTime)}
            helperText={formik.touched.endTime && formik.errors.endTime}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 3 }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Add Shift</Button>
          </Box>
        </form>
      </Box>
    </Drawer>
  );
};

export default AddShiftDialog;