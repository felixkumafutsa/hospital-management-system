import { useAppointmentDrawerStore } from '../stores/appointmentDrawerStore';
import AppointmentDetails from './AppointmentDetails';

const AppointmentDrawerContent = () => {
  const { selectedAppointmentId } = useAppointmentDrawerStore();

  return selectedAppointmentId ? (
    <AppointmentDetails appointmentId={selectedAppointmentId} />
  ) : (
    // We can add a list component here if needed in the future
    null
  );
};

export default AppointmentDrawerContent;