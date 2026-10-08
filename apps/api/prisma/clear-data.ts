import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (process.env.NODE_ENV === 'production') {
  throw new Error('The clear-data utility is disabled in production.');
}

if (process.env.CONFIRM_CLEAR_CLINIC_DATA !== 'I_UNDERSTAND') {
  throw new Error('Set CONFIRM_CLEAR_CLINIC_DATA=I_UNDERSTAND to clear local clinic data.');
}

async function main() {
  console.log('Starting data clearing process...');

  // The order of deletion matters to avoid foreign key constraint errors.
  // Start with models that are not depended upon by other models.

  // Clinical Records
  await prisma.diagnosis.deleteMany({});
  await prisma.vital.deleteMany({});
  await prisma.consultation.deleteMany({});

  // Lab
  await prisma.labResult.deleteMany({});
  await prisma.labRequestItem.deleteMany({});
  await prisma.labRequest.deleteMany({});
  await prisma.labTest.deleteMany({});

  // Pharmacy
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.prescriptionItem.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.medicineBatch.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.medicine.deleteMany({});

  // Billing
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});

  // Maternity
  await prisma.postnatalRecord.deleteMany({});
  await prisma.deliveryRecord.deleteMany({});
  await prisma.ancRecord.deleteMany({});
  await prisma.maternityProfile.deleteMany({});

  // Scheduling
  await prisma.timeOffRequest.deleteMany({});
  await prisma.staffSchedule.deleteMany({});
  await prisma.dutyRoster.deleteMany({});

  // Appointments & Visits
  await prisma.appointment.deleteMany({});
  await prisma.visit.deleteMany({});

  // Patients
  await prisma.patient.deleteMany({});

  // Ward Management
  await prisma.bed.deleteMany({});
  await prisma.ward.deleteMany({});

  // Auth (excluding User and Role)
  await prisma.refreshToken.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.auditLog.deleteMany({});

  console.log('Data clearing process completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
