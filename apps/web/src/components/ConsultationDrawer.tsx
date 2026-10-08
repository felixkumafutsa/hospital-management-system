import { Drawer } from '@mui/material';
import ConsultationDrawerContent from './ConsultationDrawerContent';
import { useConsultationDrawerStore } from '../stores/consultationDrawerStore';

const ConsultationDrawer = () => {
  const { isOpen, closeDrawer } = useConsultationDrawerStore();

  return (
    <Drawer anchor="right" open={isOpen} onClose={closeDrawer}>
      <ConsultationDrawerContent />
    </Drawer>
  );
};

export default ConsultationDrawer;