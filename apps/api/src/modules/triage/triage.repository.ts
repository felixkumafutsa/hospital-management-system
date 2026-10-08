import { prisma } from '../../config/database';
import { RecordVitalsInput } from './triage.validator';
import { VisitStatus } from '@prisma/client';

export const saveVitals = async (nurseId: string, data: RecordVitalsInput) => {
  let bmi: number | undefined = undefined;
  if (data.weightKg && data.heightCm && data.heightCm > 0) {
    const heightInMeters = data.heightCm / 100;
    bmi = parseFloat((data.weightKg / (heightInMeters * heightInMeters)).toFixed(2));
  }

  return prisma.$transaction(async (tx) => {
    const vital = await tx.vital.create({
      data: {
        visitId: data.visitId,
        recordedBy: nurseId,
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        bmi,
        bpSystolic: data.bpSystolic,
        bpDiastolic: data.bpDiastolic,
        pulseRate: data.pulseRate,
        respiratoryRate: data.respiratoryRate,
        temperatureC: data.temperatureC,
        oxygenSaturation: data.oxygenSaturation,
        bloodSugarMmol: data.bloodSugarMmol,
        notes: data.notes,
      },
    });

    const now = new Date();
    const activeRoster = await tx.dutyRoster.findMany({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
        staff: {
          isActive: true,
          role: { name: 'DOCTOR' },
        },
      },
      select: { staffId: true },
    });
    const doctorIds = [...new Set(activeRoster.map(({ staffId }) => staffId))];

    let doctorId: string | null = null;
    if (doctorIds.length > 0) {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const queueLoads = await tx.appointment.groupBy({
        by: ['doctorId'],
        where: {
          doctorId: { in: doctorIds },
          appointmentDate: { gte: dayStart, lt: dayEnd },
          status: { in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'] },
        },
        _count: { _all: true },
      });
      const loadByDoctor = new Map(
        queueLoads.map(({ doctorId: assignedDoctorId, _count }) => [
          assignedDoctorId,
          _count._all,
        ])
      );
      doctorId = doctorIds.reduce((leastLoaded, candidate) =>
        (loadByDoctor.get(candidate) ?? 0) < (loadByDoctor.get(leastLoaded) ?? 0)
          ? candidate
          : leastLoaded
      );
    }

    const visit = await tx.visit.findUniqueOrThrow({
      where: { id: data.visitId },
      select: {
        patientId: true,
        reasonForVisit: true,
        appointments: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });
    const existingAppointment = visit.appointments[0];
    let appointment;
    if (existingAppointment) {
      appointment = await tx.appointment.update({
        where: { id: existingAppointment.id },
        data: {
          doctorId: existingAppointment.doctorId ?? doctorId,
          visitId: data.visitId,
          status: existingAppointment.status === 'SCHEDULED' || existingAppointment.status === 'CONFIRMED'
            ? 'CHECKED_IN'
            : existingAppointment.status,
        },
        include: {
          doctor: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    } else {
      const end = new Date(now.getTime() + 15 * 60 * 1000);
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };
      appointment = await tx.appointment.create({
        data: {
          patientId: visit.patientId,
          doctorId,
          appointmentDate: now,
          startTime: now.toLocaleTimeString('en-GB', timeOptions),
          endTime: end.toLocaleTimeString('en-GB', timeOptions),
          type: 'CONSULTATION',
          notes: visit.reasonForVisit ?? 'Walk-in consultation',
          status: 'CHECKED_IN',
          visitId: data.visitId,
        },
        include: {
          doctor: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    }

    await tx.visit.update({
      where: { id: data.visitId },
      data: { status: VisitStatus.WAITING_FOR_CONSULTATION },
    });

    return { vital, appointment };
  });
};

export const getVitalsByVisitId = async (visitId: string) => {
  return prisma.vital.findMany({
    where: { visitId },
    orderBy: { recordedAt: 'desc' },
  });
};

export const getTriageQueueVisits = async () => {
  return prisma.visit.findMany({
    where: {
      status: {
        in: [VisitStatus.REGISTERED, VisitStatus.WAITING_FOR_CONSULTATION],
      },
      vitals: {
        none: {},
      },
    },
    orderBy: { visitDate: 'asc' },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          patientNumber: true,
        },
      },
    },
  });
};

export const countTodayTriage = async (fromDate?: Date, toDate?: Date) => {
  const where: any = {};
  if (fromDate || toDate) {
    where.recordedAt = {};
    if (fromDate) where.recordedAt.gte = fromDate;
    if (toDate) where.recordedAt.lte = toDate;
  }
  return prisma.vital.count({ where });
};
