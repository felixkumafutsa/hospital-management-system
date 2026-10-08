require('dotenv').config();

const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = process.env.CLINIC_TEST_API_URL || 'http://127.0.0.1:4000/api/v1';
const parsedBaseUrl = new URL(BASE_URL);
if (!['localhost', '127.0.0.1', '::1'].includes(parsedBaseUrl.hostname)) {
  throw new Error('Clinic journey test only runs against a local API. Set CLINIC_TEST_API_URL to localhost.');
}

const prisma = new PrismaClient();
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const created = {
  patientIds: [],
  appointmentIds: [],
  visitIds: [],
  consultationIds: [],
  labRequestIds: [],
  labTestIds: [],
  maternityProfileIds: [],
  ancRecordIds: [],
  deliveryRecordIds: [],
  postnatalRecordIds: [],
  surgicalProcedureIds: [],
  procedureCatalogIds: [],
  theaterIds: [],
  staffUserIds: [],
  prescriptionIds: [],
  invoiceIds: [],
  medicineIds: [],
  batchIds: [],
  supplierIds: [],
  dutyRosterIds: [],
};
let originalConsultationSetting;
let changedConsultationSetting = false;
let otherProcedureCatalog;
let maternityProcedureCatalog;

const seededUsers = {
  admin: {
    email: 'admin@betterlifeclinic.mw',
    password: undefined,
  },
  reception: {
    email: 'reception@betterlifeclinic.mw',
    password: undefined,
  },
  nurse: {
    email: 'nurse@betterlifeclinic.mw',
    password: undefined,
  },
  doctor: {
    email: 'chisomo.banda@betterlifeclinic.mw',
    password: undefined,
  },
  lab: {
    email: 'labtech@betterlifeclinic.mw',
    password: undefined,
  },
  pharmacist: {
    email: 'pharmacist@betterlifeclinic.mw',
    password: undefined,
  },
};

const credentials = Object.fromEntries(Object.entries(seededUsers).map(([role, seeded]) => {
  const prefix = `CLINIC_TEST_${role.toUpperCase()}`;
  return [role, {
    email: process.env[`${prefix}_EMAIL`] || seeded.email,
    password: process.env[`${prefix}_PASSWORD`] || seeded.password,
  }];
}));

if (Object.values(credentials).some((credential) => !credential.password)) {
  throw new Error('Set CLINIC_TEST_<ROLE>_PASSWORD variables before running the clinic journey.');
}
const tokens = {};
const users = {};
let activeStage = 'startup';

function trackCreated(kind, id) {
  if (id && !created[kind].includes(id)) created[kind].push(id);
}

async function request(role, method, path, body) {
  const response = await fetch(new URL(path, BASE_URL), {
    method,
    headers: {
      ...(role ? { Authorization: `Bearer ${tokens[role]}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${method} ${path} returned ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function stage(name, action) {
  activeStage = name;
  const result = await action();
  console.log(`PASS ${name}`);
  return result;
}

async function loginAllRoles() {
  for (const [role, credential] of Object.entries(credentials)) {
    const result = await request(null, 'POST', '/auth/login', credential);
    const accessToken = result?.data?.accessToken;
    const user = result?.data?.user;
    assert.ok(accessToken, `${role} login did not return an access token`);
    assert.ok(user?.id, `${role} login did not return a user ID`);
    tokens[role] = accessToken;
    users[role] = user;
  }
}

async function cleanup() {
  if (changedConsultationSetting) {
    if (originalConsultationSetting) {
      await prisma.systemSetting.update({
        where: { key: 'CONSULTATION_FEE' },
        data: { value: originalConsultationSetting.value },
      });
    } else {
      await prisma.systemSetting.deleteMany({ where: { key: 'CONSULTATION_FEE' } });
    }
    changedConsultationSetting = false;
  }
  if (created.patientIds.length) {
    const patientInvoices = await prisma.invoice.findMany({
      where: { patientId: { in: created.patientIds } },
      select: { id: true },
    });
    patientInvoices.forEach((invoice) => trackCreated('invoiceIds', invoice.id));
  }
  if (created.invoiceIds.length) {
    await prisma.payment.deleteMany({ where: { invoiceId: { in: created.invoiceIds } } });
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: created.invoiceIds } } });
    await prisma.invoice.deleteMany({ where: { id: { in: created.invoiceIds } } });
  }
  if (created.postnatalRecordIds.length) {
    await prisma.postnatalRecord.deleteMany({ where: { id: { in: created.postnatalRecordIds } } });
  }
  if (created.deliveryRecordIds.length) {
    await prisma.deliveryRecord.deleteMany({ where: { id: { in: created.deliveryRecordIds } } });
  }
  if (created.ancRecordIds.length) {
    await prisma.ancRecord.deleteMany({ where: { id: { in: created.ancRecordIds } } });
  }
  if (created.surgicalProcedureIds.length) {
    await prisma.surgicalProcedure.deleteMany({ where: { id: { in: created.surgicalProcedureIds } } });
  }
  if (created.staffUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: created.staffUserIds } } });
  }
  if (created.theaterIds.length) {
    await prisma.theater.deleteMany({ where: { id: { in: created.theaterIds } } });
  }
  if (created.prescriptionIds.length) {
    await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: { in: created.prescriptionIds } } });
    await prisma.prescription.deleteMany({ where: { id: { in: created.prescriptionIds } } });
  }
  if (created.labRequestIds.length) {
    await prisma.labResult.deleteMany({ where: { requestId: { in: created.labRequestIds } } });
    await prisma.labRequestItem.deleteMany({ where: { requestId: { in: created.labRequestIds } } });
    await prisma.labRequest.deleteMany({ where: { id: { in: created.labRequestIds } } });
  }
  if (created.labTestIds.length) {
    await prisma.labTest.deleteMany({ where: { id: { in: created.labTestIds } } });
  }
  if (created.consultationIds.length) {
    await prisma.diagnosis.deleteMany({ where: { consultationId: { in: created.consultationIds } } });
    await prisma.consultation.deleteMany({ where: { id: { in: created.consultationIds } } });
  }
  if (created.appointmentIds.length) {
    await prisma.appointment.deleteMany({ where: { id: { in: created.appointmentIds } } });
  }
  if (created.visitIds.length) {
    await prisma.vital.deleteMany({ where: { visitId: { in: created.visitIds } } });
  }
  if (created.batchIds.length) {
    await prisma.inventoryTransaction.deleteMany({ where: { batchId: { in: created.batchIds } } });
    await prisma.medicineBatch.deleteMany({ where: { id: { in: created.batchIds } } });
  }
  if (created.medicineIds.length) {
    await prisma.medicine.deleteMany({ where: { id: { in: created.medicineIds } } });
  }
  if (created.supplierIds.length) {
    await prisma.supplier.deleteMany({ where: { id: { in: created.supplierIds } } });
  }
  if (created.visitIds.length) {
    await prisma.visit.deleteMany({ where: { id: { in: created.visitIds } } });
  }
  if (created.maternityProfileIds.length) {
    await prisma.maternityProfile.deleteMany({ where: { id: { in: created.maternityProfileIds } } });
  }
  if (created.procedureCatalogIds.length) {
    await prisma.procedureCatalog.deleteMany({ where: { id: { in: created.procedureCatalogIds } } });
  }
  if (created.patientIds.length) {
    await prisma.patient.deleteMany({ where: { id: { in: created.patientIds } } });
  }
  if (created.dutyRosterIds.length) {
    await prisma.dutyRoster.deleteMany({ where: { id: { in: created.dutyRosterIds } } });
  }
}

async function runJourney() {
  await stage('API health', async () => {
    const result = await request(null, 'GET', '/health');
    assert.equal(result?.data?.status, 'healthy');
  });

  await stage('Role authentication', loginAllRoles);

  const pricing = await stage('Admin configures temporary consultation fee', async () => {
    originalConsultationSetting = await prisma.systemSetting.findUnique({ where: { key: 'CONSULTATION_FEE' } });
    const testFee = 100;
    await request('admin', 'PUT', '/settings/pricing/consultation', { consultationFee: testFee });
    changedConsultationSetting = true;
    const result = await request('reception', 'GET', '/settings/pricing');
    assert.equal(Number(result?.settings?.consultationFee), testFee);
    return testFee;
  });

  const labTest = await stage('Doctor creates journey lab catalog item', async () => {
    const result = await request('doctor', 'POST', '/lab/tests', {
      name: `Journey CBC ${runId}`,
      code: `JRN-${runId}`,
      category: 'HEMATOLOGY',
      unit: 'cells/uL',
      normalRange: 'Journey reference interval',
      price: 150,
    });
    const test = result?.id ? result : result?.test || result?.data;
    assert.ok(test?.id, 'Lab catalog creation response did not include a test');
    trackCreated('labTestIds', test.id);
    return test;
  });

  const patient = await stage('Reception registers patient', async () => {
    const result = await request('reception', 'POST', '/patients', {
      firstName: 'Journey',
      lastName: runId,
      dateOfBirth: '1990-01-01',
      gender: 'OTHER',
      phone: `+26599${String(Date.now()).slice(-7)}`,
      email: `clinic-journey-${runId}@example.test`,
      allergies: [],
    });
    const createdPatient = result?.patient;
    assert.ok(createdPatient?.id, 'Patient creation response did not include a patient');
    trackCreated('patientIds', createdPatient.id);
    return createdPatient;
  });

  const appointment = await stage('Reception schedules and checks in', async () => {
    const result = await request('reception', 'POST', '/appointments', {
      patientId: patient.id,
      doctorId: users.doctor.id,
      appointmentDate: new Date().toISOString(),
      startTime: '09:00',
      endTime: '09:30',
      type: 'CONSULTATION',
      notes: `Automated clinic journey ${runId}`,
    });
    const createdAppointment = result?.appointment;
    assert.ok(createdAppointment?.id, 'Appointment creation response did not include an appointment');
    trackCreated('appointmentIds', createdAppointment.id);

    const checkedIn = await request('reception', 'PUT', `/appointments/${createdAppointment.id}/status`, {
      status: 'CHECKED_IN',
    });
    const linkedVisitId = checkedIn?.appointment?.visitId;
    assert.ok(linkedVisitId, 'Checked-in appointment was not linked to a visit');
    trackCreated('visitIds', linkedVisitId);
    const invoiceResult = await request('reception', 'GET', `/finance/invoices/visit/${linkedVisitId}`);
    const visitInvoice = invoiceResult?.invoice || invoiceResult?.data || invoiceResult;
    assert.equal(visitInvoice.visitId, linkedVisitId, 'Appointment check-in did not create a visit invoice');
    assert.equal(Number(visitInvoice.total), 0, 'New visit invoice should start with a zero balance');
    trackCreated('invoiceIds', visitInvoice.id);
    return checkedIn.appointment;
  });

  await stage('Nurse records visit vitals', async () => {
    const result = await request('nurse', 'POST', '/triage/vitals', {
      visitId: appointment.visitId,
      weightKg: 68,
      heightCm: 170,
      bpSystolic: 120,
      bpDiastolic: 80,
      pulseRate: 72,
      respiratoryRate: 16,
      temperatureC: 36.7,
      oxygenSaturation: 98,
      notes: `Journey vitals ${runId}`,
    });
    assert.ok(result?.vital?.id || result?.id, 'Vitals endpoint did not return a recorded vital');
    assert.equal(result?.appointment?.doctorId, users.doctor.id, 'Triage changed the existing appointment assignment');
  });

  const consultation = await stage('Doctor performs consultation', async () => {
    const result = await request('doctor', 'POST', '/consultations', {
      visitId: appointment.visitId,
      chiefComplaint: 'Automated journey symptom check',
      historyOfPC: 'Symptoms started today',
      examination: 'Stable, no acute distress',
      clinicalNotes: `Journey consultation ${runId}`,
      plan: 'Laboratory investigation followed by treatment',
      diagnoses: [{ icd10Code: 'R53.83', icd10Desc: 'Fatigue, unspecified' }],
    });
    const record = result?.consultation || result;
    assert.ok(record?.id, 'Consultation response did not include a consultation');
    assert.equal(Number(record.consultationFee), pricing, 'Consultation did not save the configured system fee');
    trackCreated('consultationIds', record.id);
    return record;
  });

  await stage('Doctor refers visit to laboratory', async () => {
    const result = await request('doctor', 'PUT', `/visits/${appointment.visitId}/send-to-lab`, {});
    assert.ok(result?.visit?.id, 'Visit was not routed to the laboratory');
  });

  const labRequest = await stage('Doctor orders visit-linked lab test', async () => {
    const result = await request('doctor', 'POST', '/lab/requests', {
      visitId: appointment.visitId,
      testIds: [labTest.id],
      priority: 'ROUTINE',
      notes: `Journey lab request ${runId}`,
    });
    const record = result?.id ? result : result?.labRequest || result?.data;
    assert.ok(record?.id, 'Lab request response did not include a request');
    trackCreated('labRequestIds', record.id);
    assert.equal(record.visitId, appointment.visitId, 'Lab request is not linked to the visit');
    return record;
  });

  await stage('Lab technician processes and returns results', async () => {
    await request('lab', 'PUT', `/lab/requests/${labRequest.id}/status`, { status: 'PROCESSING' });
    await request('lab', 'POST', `/lab/requests/${labRequest.id}/results`, {
      testId: labTest.id,
      value: 'Within reference range',
      unit: labTest.unit || undefined,
      interpretation: 'No urgent abnormality detected',
      processedBy: users.lab.id,
      isCritical: false,
    });
    await request('lab', 'PUT', `/lab/requests/${labRequest.id}/status`, { status: 'COMPLETED' });
    const result = await request('lab', 'PUT', `/visits/${appointment.visitId}/lab-results-available`, {});
    assert.ok(result?.visit?.id, 'Lab results were not returned to the visit');
  });

  const stock = await stage('Pharmacy receives prescription stock', async () => {
    const result = await request('pharmacist', 'POST', '/pharmacy/stock/receive', {
      name: `Journey Medicine ${runId}`,
      genericName: `Journey Generic ${runId}`,
      strength: '250 mg',
      form: 'TABLET',
      unit: 'tablet',
      reorderLevel: 1,
      isOtc: false,
      batchNumber: `JRN-${runId}`,
      quantity: 8,
      costPrice: 10,
      sellingPrice: 25,
      supplierName: `Journey Supplier ${runId}`,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const medicine = result?.data;
    assert.ok(medicine?.id && medicine?.batches?.[0]?.id, 'Stock receipt did not create a medicine batch');
    trackCreated('medicineIds', medicine.id);
    trackCreated('batchIds', medicine.batches[0].id);
    trackCreated('supplierIds', medicine.batches[0].supplierId);
    return medicine;
  });

  const prescription = await stage('Doctor prescribes visit-linked medication', async () => {
    const result = await request('doctor', 'POST', '/prescriptions', {
      visitId: appointment.visitId,
      prescribedBy: users.doctor.id,
      notes: `Journey prescription ${runId}`,
      items: [{
        medicineId: stock.id,
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '3 days',
        quantity: 6,
      }],
    });
    const record = result?.prescription || result?.data || result;
    assert.ok(record?.id, 'Prescription response did not include a prescription');
    trackCreated('prescriptionIds', record.id);
    assert.equal(record.visitId, appointment.visitId, 'Prescription is not linked to the visit');
    return record;
  });

  const invoice = await stage('Reception reuses the single visit invoice', async () => {
    const result = await request('reception', 'GET', `/finance/invoices/visit/${appointment.visitId}`);
    const record = result?.invoice || result?.data || result;
    assert.ok(record?.id, 'Invoice response did not include an invoice');
    assert.equal(record.visitId, appointment.visitId, 'Invoice is not linked to the visit');
    const consultationLine = record.items?.find((item) => item.category === 'CONSULTATION');
    assert.ok(consultationLine, 'Invoice is missing the consultation line');
    assert.equal(Number(consultationLine.unitPrice), pricing, 'Invoice did not use the saved consultation fee');
    const medicationLines = record.items?.filter((item) => item.category === 'MEDICATION') || [];
    assert.equal(medicationLines.length, 1, 'Prescription was billed more than once');
    assert.equal(medicationLines[0].reference, prescription.items?.[0]?.id, 'Medication invoice line is not linked to its prescription item');
    assert.equal(Number(record.total), pricing + Number(labTest.price) + 150, 'Invoice total does not match consultation, lab, and medication charges');
    trackCreated('invoiceIds', record.id);
    return record;
  });

  await stage('Reception records service-only partial payment', async () => {
    await request('reception', 'POST', `/finance/invoices/${invoice.id}/payments`, {
      amount: pricing + Number(labTest.price),
      method: 'CASH',
      notes: `Journey service-only payment ${runId}`,
    });
    const result = await request('reception', 'GET', `/finance/invoices/${invoice.id}`);
    const record = result?.invoice || result?.data || result;
    assert.equal(record.status, 'PARTIAL', 'Invoice should remain partially paid while medication is outstanding');
    assert.equal(record.visitId, appointment.visitId);
    assert.equal(Number(record.balance), 150, 'Partial payment should leave the medication charge due');
  });

  await stage('Pharmacy blocks dispensing before medication is paid', async () => {
    const response = await fetch(new URL(`/prescriptions/${prescription.id}/dispense`, BASE_URL), {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.pharmacist}` },
    });
    const payload = await response.json().catch(() => null);
    assert.equal(response.status, 409, `Expected medication balance to block dispensing, got ${response.status}`);
    assert.equal(payload?.error?.code || payload?.code, 'MEDICATION_PAYMENT_REQUIRED');
  });

  await stage('Pharmacy blocks expired stock after medication payment', async () => {
    await request('reception', 'POST', `/finance/invoices/${invoice.id}/payments`, {
      amount: 150,
      method: 'CASH',
      notes: `Journey medication payment ${runId}`,
    });
    await prisma.medicineBatch.update({
      where: { id: stock.batches[0].id },
      data: { expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const response = await fetch(new URL(`/prescriptions/${prescription.id}/dispense`, BASE_URL), {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.pharmacist}` },
    });
    const payload = await response.json().catch(() => null);
    assert.equal(response.status, 409, `Expected expired stock to block dispensing, got ${response.status}`);
    assert.equal(payload?.error?.code || payload?.code, 'INSUFFICIENT_STOCK');
    await prisma.medicineBatch.update({
      where: { id: stock.batches[0].id },
      data: { expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    });
  });

  await stage('Medication balance is confirmed paid', async () => {
    const result = await request('reception', 'GET', `/finance/invoices/${invoice.id}`);
    const record = result?.invoice || result?.data || result;
    assert.equal(record.status, 'PAID', 'Invoice did not reach PAID status');
    assert.equal(Number(record.balance), 0);
  });

  await stage('Pharmacy dispenses and completes visit', async () => {
    const result = await request('pharmacist', 'POST', `/prescriptions/${prescription.id}/dispense`);
    const record = result?.prescription || result?.data || result;
    assert.equal(record.status, 'DISPENSED', 'Prescription did not reach DISPENSED status');
    const visitResult = await request('pharmacist', 'GET', `/visits/${appointment.visitId}`);
    const visit = visitResult?.visit || visitResult?.data || visitResult;
    assert.equal(visit.status, 'COMPLETED', 'Visit did not complete after dispensing');
  });

  await stage('Walk-in triage warns when no doctor is on duty', async () => {
    const now = new Date();
    const activeDoctors = await prisma.dutyRoster.count({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
        staff: { isActive: true, role: { name: 'DOCTOR' } },
      },
    });
    if (activeDoctors > 0) {
      console.log('SKIP no-doctor scenario: this database already has an active doctor roster');
      return;
    }

    const patientResult = await request('reception', 'POST', '/patients', {
      firstName: 'Walkin',
      lastName: `NoDoctor-${runId}`,
      dateOfBirth: '1992-01-01',
      gender: 'OTHER',
      phone: `+26598${String(Date.now()).slice(-7)}`,
      email: `clinic-no-doctor-${runId}@example.test`,
      allergies: [],
    });
    const walkinPatient = patientResult?.patient;
    assert.ok(walkinPatient?.id, 'Walk-in patient creation failed');
    trackCreated('patientIds', walkinPatient.id);

    const visitResult = await request('reception', 'POST', '/visits', {
      patientId: walkinPatient.id,
      visitType: 'OUTPATIENT',
      reasonForVisit: 'Doctor roster fallback test',
    });
    const visit = visitResult?.visit || visitResult?.data || visitResult;
    assert.ok(visit?.id, 'Reception walk-in visit creation failed');
    trackCreated('visitIds', visit.id);

    const invoiceResult = await request('reception', 'GET', `/finance/invoices/visit/${visit.id}`);
    const visitInvoice = invoiceResult?.invoice || invoiceResult?.data || invoiceResult;
    assert.equal(visitInvoice.visitId, visit.id, 'Walk-in visit invoice was not created at registration');
    assert.equal(Number(visitInvoice.balance), 0, 'Walk-in visit invoice should start at zero balance');
    trackCreated('invoiceIds', visitInvoice.id);

    const vitalsResult = await request('nurse', 'POST', '/triage/vitals', {
      visitId: visit.id,
      bpSystolic: 118,
      bpDiastolic: 78,
      notes: `Unassigned queue test ${runId}`,
    });
    assert.ok(vitalsResult?.appointment?.id, 'Triage did not create a consultation appointment');
    assert.equal(vitalsResult.appointment.doctorId, null, 'No-doctor scenario unexpectedly assigned a doctor');
    assert.ok(vitalsResult.assignmentWarning, 'Nurse was not warned that no doctor was on duty');
    trackCreated('appointmentIds', vitalsResult.appointment.id);
  });

  const walkinPatient = await stage('Reception registers a walk-in for the no-lab path', async () => {
    const patientResult = await request('reception', 'POST', '/patients', {
      firstName: 'Walkin',
      lastName: `NoLab-${runId}`,
      dateOfBirth: '1993-01-01',
      gender: 'OTHER',
      phone: `+26597${String(Date.now()).slice(-7)}`,
      email: `clinic-no-lab-${runId}@example.test`,
      allergies: [],
    });
    const patientRecord = patientResult?.patient;
    assert.ok(patientRecord?.id, 'No-lab patient creation failed');
    trackCreated('patientIds', patientRecord.id);

    const now = new Date();
    const roster = await prisma.dutyRoster.create({
      data: {
        staffId: users.doctor.id,
        startTime: new Date(now.getTime() - 60_000),
        endTime: new Date(now.getTime() + 60 * 60_000),
      },
    });
    trackCreated('dutyRosterIds', roster.id);

    const visitResult = await request('reception', 'POST', '/visits', {
      patientId: patientRecord.id,
      visitType: 'OUTPATIENT',
      reasonForVisit: 'No laboratory required',
    });
    const visit = visitResult?.visit || visitResult?.data || visitResult;
    assert.ok(visit?.id, 'Reception did not create a walk-in visit');
    trackCreated('visitIds', visit.id);

    const invoiceResult = await request('reception', 'GET', `/finance/invoices/visit/${visit.id}`);
    const invoice = invoiceResult?.invoice || invoiceResult?.data || invoiceResult;
    assert.equal(invoice.visitId, visit.id, 'New walk-in visit has no invoice');
    assert.equal(Number(invoice.total), 0, 'New visit invoice should begin at zero');
    trackCreated('invoiceIds', invoice.id);
    return { patient: patientRecord, visit, invoice };
  });

  await stage('Nurse triage assigns walk-in to on-duty doctor', async () => {
    const result = await request('nurse', 'POST', '/triage/vitals', {
      visitId: walkinPatient.visit.id,
      weightKg: 62,
      heightCm: 165,
      bpSystolic: 116,
      bpDiastolic: 76,
      pulseRate: 70,
    });
    assert.equal(result?.appointment?.doctorId, users.doctor.id, 'Walk-in was not assigned to the active on-duty doctor');
    assert.equal(result?.assignmentWarning, undefined, 'Assignment warning returned despite a duty doctor');
    trackCreated('appointmentIds', result.appointment.id);

    const queueResult = await request('doctor', 'GET', '/visits/queue');
    const queue = queueResult?.queue || [];
    assert.ok(queue.some((queuedVisit) => queuedVisit.id === walkinPatient.visit.id), 'Assigned walk-in is missing from the doctor queue');
  });

  await stage('Doctor consults a visit without ordering lab tests', async () => {
    const result = await request('doctor', 'POST', '/consultations', {
      visitId: walkinPatient.visit.id,
      chiefComplaint: 'Mild headache',
      examination: 'No red flags',
      clinicalNotes: `No-lab consultation ${runId}`,
      plan: 'Treat symptomatically',
      diagnoses: [{ icd10Code: 'R51.9', icd10Desc: 'Headache, unspecified' }],
    });
    const record = result?.consultation || result;
    assert.ok(record?.id, 'No-lab consultation was not saved');
    trackCreated('consultationIds', record.id);
    const labCount = await prisma.labRequest.count({ where: { visitId: walkinPatient.visit.id } });
    assert.equal(labCount, 0, 'No-lab scenario unexpectedly created a lab request');
    return record;
  });

  const noLabPrescription = await stage('Doctor prescribes for the no-lab visit', async () => {
    const result = await request('doctor', 'POST', '/prescriptions', {
      visitId: walkinPatient.visit.id,
      prescribedBy: users.doctor.id,
      notes: `No-lab treatment ${runId}`,
      items: [{
        medicineId: stock.id,
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '1 day',
        quantity: 1,
      }],
    });
    const record = result?.prescription || result?.data || result;
    assert.ok(record?.id, 'No-lab prescription was not created');
    trackCreated('prescriptionIds', record.id);
    return record;
  });

  const noLabInvoice = await stage('No-lab visit has consultation and medication charges only', async () => {
    const result = await request('reception', 'GET', `/finance/invoices/visit/${walkinPatient.visit.id}`);
    const record = result?.invoice || result?.data || result;
    const categories = record.items.map((item) => item.category);
    assert.ok(categories.includes('CONSULTATION'), 'No-lab invoice is missing the consultation charge');
    assert.ok(categories.includes('MEDICATION'), 'No-lab invoice is missing the prescription charge');
    assert.ok(!categories.includes('LAB_TEST'), 'No-lab invoice unexpectedly contains a lab charge');
    assert.equal(record.items.filter((item) => item.category === 'MEDICATION').length, 1);
    return record;
  });

  await stage('Reception pays and pharmacy dispenses the no-lab prescription', async () => {
    await request('reception', 'POST', `/finance/invoices/${noLabInvoice.id}/payments`, {
      amount: Number(noLabInvoice.balance),
      method: 'CASH',
      notes: `No-lab visit payment ${runId}`,
    });
    const result = await request('pharmacist', 'POST', `/prescriptions/${noLabPrescription.id}/dispense`);
    const record = result?.prescription || result?.data || result;
    assert.equal(record.status, 'DISPENSED');
    const visitResult = await request('pharmacist', 'GET', `/visits/${walkinPatient.visit.id}`);
    const visit = visitResult?.visit || visitResult?.data || visitResult;
    assert.equal(visit.status, 'COMPLETED', 'No-lab visit was not completed after dispensing');
  });

  await stage('Admin configures maternity and non-maternity procedures', async () => {
    for (const [suffix, maternity] of [['OTHER', false], ['CSECTION', true]]) {
      const result = await request('admin', 'POST', '/theater/catalog', {
        code: `JRN-${suffix}-${runId}`.slice(0, 30),
        name: `Journey ${suffix} ${runId}`,
        price: 500,
        durationMinutes: 60,
        isMaternityDelivery: maternity,
      });
      assert.equal(result.isMaternityDelivery, maternity, 'Procedure catalog did not preserve its maternity-delivery flag');
      trackCreated('procedureCatalogIds', result.id);
      if (maternity) {
        maternityProcedureCatalog = result;
      } else {
        otherProcedureCatalog = result;
      }
    }
  });

  const theaterResources = await stage('Admin configures theater resources for scheduling', async () => {
    const roomResult = await request('admin', 'POST', '/theater/rooms', {
      name: `Journey Theater ${runId}`,
    });
    assert.ok(roomResult?.id, 'Theater room was not created');
    trackCreated('theaterIds', roomResult.id);

    const anesthetistRole = await prisma.role.findUnique({ where: { name: 'ANESTHETIST' } });
    assert.ok(anesthetistRole?.id, 'ANESTHETIST role is not configured');
    const anesthetist = await prisma.user.create({
      data: {
        staffId: `JRN-${runId}`,
        email: `journey-anesthetist-${runId}@example.test`,
        passwordHash: await bcrypt.hash(`test-only-unused-${runId}`, 4),
        firstName: 'Journey',
        lastName: 'Anesthetist',
        roleId: anesthetistRole.id,
      },
    });
    trackCreated('staffUserIds', anesthetist.id);
    return { theater: roomResult, anesthetist };
  });

  const maternityPatient = await stage('Reception registers maternity patients', async () => {
    const patients = [];
    for (const suffix of ['CSection', 'Vaginal']) {
      const result = await request('reception', 'POST', '/patients', {
        firstName: 'Journey',
        lastName: `${suffix}-${runId}`,
        dateOfBirth: '1995-01-01',
        gender: 'FEMALE',
        phone: `+26596${String(Date.now()).slice(-7)}`,
        email: `clinic-${suffix.toLowerCase()}-${runId}@example.test`,
        allergies: [],
      });
      assert.ok(result?.patient?.id, 'Maternity patient registration did not return a patient');
      trackCreated('patientIds', result.patient.id);
      patients.push(result.patient);
    }
    return { cSection: patients[0], vaginal: patients[1] };
  });

  const ancVisits = await stage('Maternity follow-up creates distinct ANC visits and invoices', async () => {
    const records = [];
    for (const gestationWeeks of [20, 24]) {
      const result = await request('nurse', 'POST', '/maternity/anc', {
        patientId: maternityPatient.cSection.id,
        gestationWeeks,
        gravida: 1,
        parity: 0,
        weightKg: 62,
        bpSystolic: 116,
        bpDiastolic: 76,
        notes: `Journey ANC ${gestationWeeks} ${runId}`,
      });
      const record = result?.data;
      assert.ok(record?.id && record?.visitId && record?.maternityProfileId, 'ANC record omitted its pregnancy or visit link');
      trackCreated('ancRecordIds', record.id);
      trackCreated('maternityProfileIds', record.maternityProfileId);
      trackCreated('visitIds', record.visitId);
      const invoiceResult = await request('reception', 'GET', `/finance/invoices/visit/${record.visitId}`);
      const invoice = invoiceResult?.invoice || invoiceResult?.data || invoiceResult;
      assert.equal(invoice.visitId, record.visitId, 'ANC visit did not create its own invoice');
      assert.equal(Number(invoice.total), pricing, 'ANC invoice did not include the configured consultation charge');
      trackCreated('invoiceIds', invoice.id);
      records.push(record);
    }
    assert.notEqual(records[0].id, records[1].id, 'ANC follow-up overwrote the earlier record');
    assert.notEqual(records[0].visitId, records[1].visitId, 'ANC follow-up reused the previous visit');
    assert.equal(records[0].maternityProfileId, records[1].maternityProfileId, 'ANC follow-up did not stay in the same pregnancy episode');
    return records;
  });

  await stage('Theater request schedules and bills a C-section at the configured price', async () => {
    await assert.rejects(
      request('nurse', 'POST', '/theater/requests/maternity', {
        maternityProfileId: ancVisits[0].maternityProfileId,
        catalogId: otherProcedureCatalog.id,
        procedureDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
      /returned 400/,
      'Theater accepted a non-maternity procedure for a C-section request',
    );

    const result = await request('nurse', 'POST', '/theater/requests/maternity', {
      maternityProfileId: ancVisits[0].maternityProfileId,
      catalogId: maternityProcedureCatalog.id,
      procedureDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    assert.ok(result?.id && result?.visitId, 'Maternity theater request did not return its case and delivery visit');
    assert.equal(result.status, 'REQUESTED', 'C-section case did not enter pending theater review');
    trackCreated('surgicalProcedureIds', result.id);
    trackCreated('visitIds', result.visitId);
    const invoiceResult = await request('reception', 'GET', `/finance/invoices/visit/${result.visitId}`);
    const invoice = invoiceResult?.invoice || invoiceResult?.data || invoiceResult;
    assert.equal(invoice.visitId, result.visitId, 'C-section request did not create a linked visit invoice');
    assert.equal(Number(invoice.total), 0, 'C-section procedure was billed before theater scheduling');
    trackCreated('invoiceIds', invoice.id);

    await assert.rejects(
      request('nurse', 'POST', '/maternity/deliveries', {
        patientId: maternityPatient.cSection.id,
        deliveryDate: new Date().toISOString(),
        deliveryMethod: 'CAESAREAN',
      }),
      /returned 409/,
      'C-section delivery was recorded before its theater case completed',
    );

    const schedule = await request('doctor', 'PUT', `/theater/${result.id}`, {
      status: 'SCHEDULED',
      theaterId: theaterResources.theater.id,
      surgeonId: users.doctor.id,
      anesthetistId: theaterResources.anesthetist.id,
      procedureDate: result.procedureDate,
    });
    assert.equal(schedule.status, 'SCHEDULED', 'C-section case did not enter scheduled status');
    assert.equal(Number(schedule.procedureFee), 500, 'Scheduled case did not snapshot the configured procedure fee');

    const billedResult = await request('reception', 'GET', `/finance/invoices/visit/${result.visitId}`);
    const billedInvoice = billedResult?.invoice || billedResult?.data || billedResult;
    const procedureCharge = billedInvoice.items?.find((item) => item.category === 'PROCEDURE');
    assert.ok(procedureCharge, 'Scheduling did not add the procedure charge to the visit invoice');
    assert.equal(Number(procedureCharge.unitPrice), 500, 'Procedure charge did not use the catalog price');
    assert.equal(procedureCharge.reference, result.id, 'Procedure charge is not linked to the theater case');
    assert.equal(Number(billedInvoice.total), 500, 'Scheduled C-section invoice total is incorrect');

    const conflictingCase = await request('nurse', 'POST', '/theater/requests/maternity', {
      maternityProfileId: ancVisits[0].maternityProfileId,
      catalogId: maternityProcedureCatalog.id,
      procedureDate: result.procedureDate,
    });
    assert.ok(conflictingCase?.id && conflictingCase?.visitId, 'Competing theater request was not created');
    trackCreated('surgicalProcedureIds', conflictingCase.id);
    trackCreated('visitIds', conflictingCase.visitId);
    const competingInvoiceResult = await request('reception', 'GET', `/finance/invoices/visit/${conflictingCase.visitId}`);
    const competingInvoice = competingInvoiceResult?.invoice || competingInvoiceResult?.data || competingInvoiceResult;
    trackCreated('invoiceIds', competingInvoice.id);

    await assert.rejects(
      request('doctor', 'PUT', `/theater/${conflictingCase.id}`, {
        status: 'SCHEDULED',
        theaterId: theaterResources.theater.id,
        surgeonId: users.doctor.id,
        anesthetistId: theaterResources.anesthetist.id,
        procedureDate: result.procedureDate,
      }),
      /returned 409/,
      'Theater accepted overlapping procedures in the same room',
    );
    assert.equal(Number(competingInvoice.total), 0, 'Rejected schedule charged for the competing procedure');
    await request('doctor', 'PUT', `/theater/${conflictingCase.id}`, { status: 'CANCELLED' });

    await request('doctor', 'PUT', `/theater/${result.id}`, { status: 'IN_PROGRESS' });
    const completedCase = await request('doctor', 'PUT', `/theater/${result.id}`, { status: 'COMPLETED' });
    assert.equal(completedCase.status, 'COMPLETED', 'C-section case did not complete');

    const deliveryResult = await request('nurse', 'POST', '/maternity/deliveries', {
      patientId: maternityPatient.cSection.id,
      deliveryDate: new Date().toISOString(),
      deliveryMethod: 'CAESAREAN',
    });
    const delivery = deliveryResult?.data;
    assert.ok(delivery?.id, 'Completed C-section case did not allow delivery recording');
    assert.equal(delivery.visitId, result.visitId, 'C-section delivery did not reuse the theater visit');
    trackCreated('deliveryRecordIds', delivery.id);
  });

  await stage('Vaginal delivery and postnatal care create linked encounters', async () => {
    const ancResult = await request('nurse', 'POST', '/maternity/anc', {
      patientId: maternityPatient.vaginal.id,
      gestationWeeks: 39,
      gravida: 2,
      parity: 1,
      notes: `Journey vaginal delivery ANC ${runId}`,
    });
    const ancRecord = ancResult?.data;
    assert.ok(ancRecord?.id && ancRecord?.visitId && ancRecord?.maternityProfileId, 'Vaginal pregnancy ANC was not linked');
    trackCreated('ancRecordIds', ancRecord.id);
    trackCreated('maternityProfileIds', ancRecord.maternityProfileId);
    trackCreated('visitIds', ancRecord.visitId);
    const ancInvoiceResult = await request('reception', 'GET', `/finance/invoices/visit/${ancRecord.visitId}`);
    const ancInvoice = ancInvoiceResult?.invoice || ancInvoiceResult?.data || ancInvoiceResult;
    assert.equal(ancInvoice.visitId, ancRecord.visitId, 'Vaginal pregnancy ANC encounter did not have an invoice');
    trackCreated('invoiceIds', ancInvoice.id);

    const deliveryResult = await request('nurse', 'POST', '/maternity/deliveries', {
      patientId: maternityPatient.vaginal.id,
      deliveryDate: new Date().toISOString(),
      deliveryMethod: 'VAGINAL',
      gestationWeeks: 39,
      babyWeightKg: 3.2,
      babyGender: 'FEMALE',
    });
    const delivery = deliveryResult?.data;
    assert.ok(delivery?.id && delivery?.visitId, 'Vaginal delivery was not linked to its own encounter');
    trackCreated('deliveryRecordIds', delivery.id);
    trackCreated('visitIds', delivery.visitId);
    const deliveryInvoiceResult = await request('reception', 'GET', `/finance/invoices/visit/${delivery.visitId}`);
    const deliveryInvoice = deliveryInvoiceResult?.invoice || deliveryInvoiceResult?.data || deliveryInvoiceResult;
    assert.equal(deliveryInvoice.visitId, delivery.visitId, 'Delivery encounter did not have an invoice');
    trackCreated('invoiceIds', deliveryInvoice.id);

    const postnatalResult = await request('nurse', 'POST', '/maternity/postnatal', {
      patientId: maternityPatient.vaginal.id,
      deliveryId: delivery.id,
      motherStatus: 'Stable',
      babyStatus: 'Stable',
      breastfeeding: true,
      notes: `Journey postnatal follow-up ${runId}`,
    });
    const postnatal = postnatalResult?.data;
    assert.ok(postnatal?.id && postnatal?.visitId, 'Postnatal care was not linked to its own encounter');
    assert.notEqual(postnatal.visitId, delivery.visitId, 'Postnatal follow-up reused the delivery encounter');
    trackCreated('postnatalRecordIds', postnatal.id);
    trackCreated('visitIds', postnatal.visitId);
    const postnatalInvoiceResult = await request('reception', 'GET', `/finance/invoices/visit/${postnatal.visitId}`);
    const postnatalInvoice = postnatalInvoiceResult?.invoice || postnatalInvoiceResult?.data || postnatalInvoiceResult;
    assert.equal(postnatalInvoice.visitId, postnatal.visitId, 'Postnatal encounter did not have an invoice');
    trackCreated('invoiceIds', postnatalInvoice.id);
  });

  const otcStock = await stage('Pharmacy receives OTC stock', async () => {
    const result = await request('pharmacist', 'POST', '/pharmacy/stock/receive', {
      name: `Journey OTC ${runId}`,
      genericName: `Journey OTC Generic ${runId}`,
      strength: '200 mg',
      form: 'TABLET',
      unit: 'tablet',
      reorderLevel: 1,
      isOtc: true,
      batchNumber: `OTC-${runId}`,
      quantity: 3,
      costPrice: 5,
      sellingPrice: 12,
      supplierName: `Journey OTC Supplier ${runId}`,
      expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const medicine = result?.data;
    assert.ok(medicine?.id && medicine?.batches?.[0]?.id, 'OTC stock receipt failed');
    trackCreated('medicineIds', medicine.id);
    trackCreated('batchIds', medicine.batches[0].id);
    trackCreated('supplierIds', medicine.batches[0].supplierId);
    return medicine;
  });

  await stage('Reception completes an OTC sale and records paid invoice', async () => {
    const result = await request('reception', 'POST', '/pharmacy/sales/otc', {
      patientId: patient.id,
      paymentMethod: 'CASH',
      items: [{ medicineId: otcStock.id, quantity: 1 }],
    });
    const sale = result?.data;
    assert.equal(sale?.invoice?.status, 'PAID', 'OTC sale invoice was not marked paid');
    assert.equal(Number(sale?.invoice?.balance), 0, 'OTC sale invoice has an outstanding balance');
    assert.equal(sale?.invoice?.items?.length, 1, 'OTC sale invoice line is missing');
    assert.equal(sale?.visit?.status, 'COMPLETED', 'OTC sale visit was not completed');
    assert.equal(sale?.visit?.patientId, patient.id);
    trackCreated('visitIds', sale.visit.id);
    trackCreated('invoiceIds', sale.invoice.id);
    const batch = await prisma.medicineBatch.findUnique({ where: { id: otcStock.batches[0].id } });
    assert.equal(batch.quantityLeft, 2, 'OTC checkout did not deduct stock');
  });

  await stage('Pharmacy dashboard reports sales, stock, and expiry', async () => {
    const result = await request('pharmacist', 'GET', '/pharmacy/dashboard/stats');
    const stats = result?.data;
    assert.ok(stats, 'Pharmacy dashboard stats were not returned');
    assert.ok(stats.todaySales.units >= 1, 'Dashboard did not report dispensed units');
    assert.ok(stats.todaySales.revenue >= 12, 'Dashboard did not include OTC revenue');
    assert.ok(stats.availableUnits >= 1, 'Dashboard did not report available stock');
    assert.ok(stats.expiringUnits >= 1, 'Dashboard did not report stock expiring within 30 days');
    assert.ok(stats.expiringBatches.some((batch) => batch.id === otcStock.batches[0].id), 'Dashboard omitted the test expiring lot');
  });

  await stage('Journey cleanup', cleanup);
  console.log('\nClinic journey passed. Test patient, encounter, invoice, and stock fixtures were removed.');
}

runJourney()
  .catch((error) => {
    console.error(`\nFAIL ${activeStage}: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (process.exitCode && (changedConsultationSetting || Object.values(created).some(Boolean))) {
        await cleanup();
        console.log('Created test records were cleaned up after failure.');
      }
    } catch (cleanupError) {
      console.error(`Cleanup failed: ${cleanupError.message}`);
      process.exitCode = 1;
    }
    await prisma.$disconnect();
  });