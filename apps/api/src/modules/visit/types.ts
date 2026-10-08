import { Visit, Patient } from '@prisma/client';

export type VisitWithPatient = Visit & { patient: Patient };