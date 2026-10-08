import { prisma } from '../../config/database';

const CONSULTATION_FEE_KEY = 'CONSULTATION_FEE';

export const getConsultationFee = async () => {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: CONSULTATION_FEE_KEY },
  });
  return setting ? Number(setting.value) : null;
};

export const setConsultationFee = async (consultationFee: number) => {
  return prisma.systemSetting.upsert({
    where: { key: CONSULTATION_FEE_KEY },
    update: { value: String(consultationFee) },
    create: { key: CONSULTATION_FEE_KEY, value: String(consultationFee) },
  });
};