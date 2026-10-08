
import { Drawer } from '@mui/material';
import { useAppointmentDrawerStore } from '../stores/appointmentDrawerStore';
import AppointmentDrawerContent from './AppointmentDrawerContent';

const AppointmentDrawer = () => {
  const { isDrawerOpen, closeDrawer } = useAppointmentDrawerStore();

  return (
    <Drawer anchor="right" open={isDrawerOpen} onClose={closeDrawer}>
      <AppointmentDrawerContent />
    </Drawer>
  );
};

export default AppointmentDrawer;