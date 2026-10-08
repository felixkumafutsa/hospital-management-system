import { Drawer } from '@mui/material';
import VisitDrawerContent from './VisitDrawerContent';
import { useVisitDrawerStore } from '../stores/visitDrawerStore';

const VisitDrawer = () => {
  const { isOpen, closeDrawer } = useVisitDrawerStore();

  return (
    <Drawer anchor="right" open={isOpen} onClose={closeDrawer}>
      <VisitDrawerContent />
    </Drawer>
  );
};

export default VisitDrawer;