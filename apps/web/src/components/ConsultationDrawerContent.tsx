import { useConsultationDrawerStore } from '../stores/consultationDrawerStore';
import ConsultationList from './ConsultationList';
import ConsultationDetails from './ConsultationDetails';

const ConsultationDrawerContent = () => {
  const { selectedConsultationId } = useConsultationDrawerStore();

  return selectedConsultationId ? (
    <ConsultationDetails
      consultationId={selectedConsultationId}
      onClose={() => {}}
    />
  ) : (
    <ConsultationList />
  );
};

export default ConsultationDrawerContent;