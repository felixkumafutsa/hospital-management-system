// Shared types between frontend and backend
// This package is accessible to both apps/api and apps/web

import { z } from 'zod';

// ==================== Base Enums (matches Prisma schema) ====================
export enum Gender {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
  OTHER = 'OTHER',
}

export enum VisitStatus {
  REGISTERED = 'REGISTERED',
  TRIAGED = 'TRIAGED',
  CONSULTING = 'CONSULTING',
  LAB_PENDING = 'LAB_PENDING',
  PHARMACY = 'PHARMACY',
  BILLING = 'BILLING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum VisitType {
  OUTPATIENT = 'OUTPATIENT',
  INPATIENT = 'INPATIENT',
  ANC = 'ANC',
  POSTNATAL = 'POSTNATAL',
  EMERGENCY = 'EMERGENCY',
}

export enum LabStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REVIEWED = 'REVIEWED',
  CANCELLED = 'CANCELLED',
}

export enum Priority {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  STAT = 'STAT',
}

export enum PrescriptionStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  DISPENSED = 'DISPENSED',
  CANCELLED = 'CANCELLED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  WAIVED = 'WAIVED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  AIRTEL_MONEY = 'AIRTEL_MONEY',
  TNM_MPAMBA = 'TNM_MPAMBA',
  BANK_TRANSFER = 'BANK_TRANSFER',
  INSURANCE = 'INSURANCE',
  WAIVER = 'WAIVER',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum DeliveryMethod {
  VAGINAL = 'VAGINAL',
  CAESAREAN = 'CAESAREAN',
  VACUUM = 'VACUUM',
  FORCEPS = 'FORCEPS',
  OTHER = 'OTHER',
}

// Maternity specific enums
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ShiftType {
  MORNING = 'MORNING', // 07:00 - 15:00
  AFTERNOON = 'AFTERNOON', // 15:00 - 23:00
  NIGHT = 'NIGHT', // 23:00 - 07:00
  DAY = 'DAY', // 08:00 - 17:00
  ON_CALL = 'ON_CALL',
}

export enum RoleType {
  ADMINISTRATOR = 'ADMINISTRATOR',
  MD = 'MD',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  RECEPTIONIST = 'RECEPTIONIST',
  LAB_TECH = 'LAB_TECH',
  PHARMACIST = 'PHARMACIST',
  CASHIER = 'CASHIER',
}

// ==================== Core Base Interfaces ====================
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Patient Types ====================
export interface Patient extends BaseEntity {
  patientNumber: string;
  nationalId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelation?: string;
  bloodGroup?: string;
  allergies: string[];
  insuranceProvider?: string;
  insuranceNumber?: string;
  isActive: boolean;
}

export interface CreatePatientInput {
  nationalId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelation?: string;
  bloodGroup?: string;
  allergies?: string[];
  insuranceProvider?: string;
  insuranceNumber?: string;
}

// Zod validation schema for patients
export const CreatePatientSchema = z.object({
  nationalId: z.string().optional(),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  dateOfBirth: z.string(),
  gender: z.nativeEnum(Gender),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  address: z.string().optional(),
  nextOfKinName: z.string().optional(),
  nextOfKinPhone: z.string().optional(),
  nextOfKinRelation: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
});

// ==================== Maternity / ANC Types ====================
export interface AncRecord extends BaseEntity {
  patientId: string;
  patient?: Patient;
  gestationWeeks: number;
  visitDate: string;
  recordedBy: string;
  weightKg?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  fetalHeartRate?: number;
  fundusHeight?: number;
  presentation?: string;
  ultrasoundNotes?: string;
  riskFactors: string[];
  notes?: string;
  nextVisitDate?: string;
  riskLevel: RiskLevel;
}

export interface CreateAncInput {
  patientId: string;
  gestationWeeks: number;
  weightKg?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  fetalHeartRate?: number;
  fundusHeight?: number;
  presentation?: string;
  ultrasoundNotes?: string;
  riskFactors?: string[];
  notes?: string;
  nextVisitDate?: string;
}

export const CreateAncSchema = z.object({
  patientId: z.string().uuid(),
  gestationWeeks: z.number().int().min(4).max(45),
  weightKg: z.number().optional(),
  bpSystolic: z.number().int().optional(),
  bpDiastolic: z.number().int().optional(),
  fetalHeartRate: z.number().int().optional(),
  fundusHeight: z.number().optional(),
  presentation: z.string().optional(),
  ultrasoundNotes: z.string().optional(),
  riskFactors: z.array(z.string()).optional(),
  notes: z.string().optional(),
  nextVisitDate: z.string().optional(),
});

export interface DeliveryRecord extends BaseEntity {
  patientId: string;
  patient?: Patient;
  deliveryDate: string;
  deliveryMethod: DeliveryMethod;
  attendedBy: string;
  gestationWeeks?: number;
  babyWeightKg?: number;
  babyGender?: Gender;
  apgarScore1Min?: number;
  apgarScore5Min?: number;
  complications?: string;
  notes?: string;
  postnatalRecords?: PostnatalRecord[];
}

export interface CreateDeliveryInput {
  patientId: string;
  deliveryDate: string;
  deliveryMethod: DeliveryMethod;
  gestationWeeks?: number;
  babyWeightKg?: number;
  babyGender?: Gender;
  apgarScore1Min?: number;
  apgarScore5Min?: number;
  complications?: string;
  notes?: string;
}

export const CreateDeliverySchema = z.object({
  patientId: z.string().uuid(),
  deliveryDate: z.string(),
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  gestationWeeks: z.number().int().min(20).max(45).optional(),
  babyWeightKg: z.number().optional(),
  babyGender: z.nativeEnum(Gender).optional(),
  apgarScore1Min: z.number().int().min(0).max(10).optional(),
  apgarScore5Min: z.number().int().min(0).max(10).optional(),
  complications: z.string().optional(),
  notes: z.string().optional(),
});

export interface PostnatalRecord extends BaseEntity {
  patientId: string;
  patient?: Patient;
  deliveryId: string;
  delivery?: DeliveryRecord;
  visitDate: string;
  recordedBy: string;
  motherStatus?: string;
  babyStatus?: string;
  breastfeeding?: boolean;
  immunizationGiven: string[];
  nextVisitDate?: string;
  notes?: string;
}

export interface CreatePostnatalInput {
  patientId: string;
  deliveryId: string;
  motherStatus?: string;
  babyStatus?: string;
  breastfeeding?: boolean;
  immunizationGiven?: string[];
  notes?: string;
  nextVisitDate?: string;
}

export const CreatePostnatalSchema = z.object({
  patientId: z.string().uuid(),
  deliveryId: z.string().uuid(),
  motherStatus: z.string().optional(),
  babyStatus: z.string().optional(),
  breastfeeding: z.boolean().optional(),
  immunizationGiven: z.array(z.string()).optional(),
  notes: z.string().optional(),
  nextVisitDate: z.string().optional(),
});

// ==================== Staff Scheduling Types ====================
export interface StaffSchedule extends BaseEntity {
  userId: string;
  staff?: User;
  shiftDate: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  department?: string;
  notes?: string;
}

export interface CreateScheduleInput {
  userId: string;
  shiftDate: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  department?: string;
  notes?: string;
}

export const CreateScheduleSchema = z.object({
  userId: z.string().uuid(),
  shiftDate: z.string(),
  shiftType: z.nativeEnum(ShiftType),
  startTime: z.string(),
  endTime: z.string(),
  department: z.string().optional(),
  notes: z.string().optional(),
});

export interface TimeOffRequest extends BaseEntity {
  userId: string;
  staff?: User;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
}

export interface CreateTimeOffInput {
  startDate: string;
  endDate: string;
  reason: string;
}

export const CreateTimeOffSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(10),
});

// ==================== User / Staff Types ====================
export interface User extends BaseEntity {
  staffId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: RoleType;
  isActive: boolean;
  lastLogin?: string;
}

export interface Role {
  name: RoleType;
  displayName: string;
  description: string;
  permissions: string[];
}

// ==================== API Response Types ====================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
  requestId: string;
}

// ==================== React Query Query Keys ====================
export const QueryKeys = {
  patients: {
    all: ['patients'] as const,
    list: (page: number, limit: number, filters?: Record<string, any>) => 
      ['patients', 'list', page, limit, filters] as const,
    detail: (id: string) => ['patients', 'detail', id] as const,
    search: (query: string) => ['patients', 'search', query] as const,
  },
  maternity: {
    ancRecords: {
      all: ['anc'] as const,
      patient: (patientId: string) => ['anc', 'patient', patientId] as const,
    },
    deliveryRecords: {
      all: ['delivery'] as const,
      patient: (patientId: string) => ['delivery', 'patient', patientId] as const,
    },
    postnatalRecords: {
      all: ['postnatal'] as const,
      patient: (patientId: string) => ['postnatal', 'patient', patientId] as const,
    },
  },
  scheduling: {
    schedules: {
      all: ['schedules'] as const,
      user: (userId: string, month?: string) => ['schedules', 'user', userId, month] as const,
      department: (department: string, date: string) => ['schedules', 'department', department, date] as const,
    },
    timeOff: {
      all: ['timeoff'] as const,
      pending: ['timeoff', 'pending'] as const,
    },
  },
  appointments: {
    all: ['appointments'] as const,
    date: (date: string) => ['appointments', 'date', date] as const,
    doctor: (doctorId: string) => ['appointments', 'doctor', doctorId] as const,
  },
} as const;

// ==================== Maternity Specific Constants ====================
export const ANTENATAL_VISIT_SCHEDULE = [
  { week: 10, description: 'First visit - Booking' },
  { week: 16, description: 'Second visit - Anomaly scan' },
  { week: 20, description: 'Third visit' },
  { week: 24, description: 'Fourth visit - Glucose test' },
  { week: 28, description: 'Fifth visit' },
  { week: 30, description: 'Sixth visit' },
  { week: 32, description: 'Seventh visit' },
  { week: 34, description: 'Eighth visit' },
  { week: 36, description: 'Ninth visit' },
  { week: 37, description: 'Tenth visit' },
  { week: 38, description: 'Eleventh visit' },
  { week: 39, description: 'Twelfth visit' },
  { week: 40, description: 'Thirteenth visit' },
];

export const POSTNATAL_VISIT_SCHEDULE = [
  { daysAfterBirth: 3, description: 'Third day checkup' },
  { daysAfterBirth: 7, description: 'One week checkup' },
  { daysAfterBirth: 42, description: 'Six weeks postnatal visit' },
  { daysAfterBirth: 180, description: 'Six month checkup' },
];

export const MATERNITY_RISK_FACTORS = [
  'Hypertension',
  'Diabetes',
  'Previous C-section',
  'Multiple gestation',
  'Advanced maternal age',
  'Teenage pregnancy',
  'Anemia',
  'HIV positive',
  'Malaria',
  'Multiple previous pregnancies',
  'Previous complications',
  'RH incompatibility',
];

// ==================== Staff Scheduling Constants ====================
export const SHIFT_TIMES = {
  [ShiftType.MORNING]: { start: '07:00', end: '15:00', name: 'Morning Shift' },
  [ShiftType.AFTERNOON]: { start: '15:00', end: '23:00', name: 'Afternoon Shift' },
  [ShiftType.NIGHT]: { start: '23:00', end: '07:00', name: 'Night Shift' },
  [ShiftType.DAY]: { start: '08:00', end: '17:00', name: 'Day Shift' },
  [ShiftType.ON_CALL]: { start: '00:00', end: '23:59', name: 'On Call' },
};

export const DEPARTMENTS = [
  'Emergency',
  'Outpatient',
  'Inpatient',
  'Maternity',
  'Laboratory',
  'Pharmacy',
  'Radiology',
  'Surgery',
  'Pediatrics',
];

// Common permissions used across the system
export const PERMISSIONS = {
  // Patient permissions
  CREATE_PATIENT: 'CREATE_PATIENT',
  VIEW_PATIENT: 'VIEW_PATIENT',
  UPDATE_PATIENT: 'UPDATE_PATIENT',
  // Maternity permissions
  CREATE_ANC: 'CREATE_ANC',
  VIEW_ANC: 'VIEW_ANC',
  UPDATE_ANC: 'UPDATE_ANC',
  CREATE_DELIVERY: 'CREATE_DELIVERY',
  VIEW_DELIVERY: 'VIEW_DELIVERY',
  CREATE_POSTNATAL: 'CREATE_POSTNATAL',
  VIEW_POSTNATAL: 'VIEW_POSTNATAL',
  // Scheduling permissions
  CREATE_SCHEDULE: 'CREATE_SCHEDULE',
  VIEW_SCHEDULE: 'VIEW_SCHEDULE',
  UPDATE_SCHEDULE: 'UPDATE_SCHEDULE',
  APPROVE_TIMEOFF: 'APPROVE_TIMEOFF',
  // Visit permissions
  CREATE_VISIT: 'CREATE_VISIT',
  VIEW_VISIT: 'VIEW_VISIT',
  UPDATE_VISIT: 'UPDATE_VISIT',
  // Lab permissions
  CREATE_LAB_REQUEST: 'CREATE_LAB_REQUEST',
  VIEW_LAB_REQUEST: 'VIEW_LAB_REQUEST',
  SUBMIT_LAB_RESULTS: 'SUBMIT_LAB_RESULTS',
  // Pharmacy permissions
  DISPENSE_MEDICATION: 'DISPENSE_MEDICATION',
  VIEW_INVENTORY: 'VIEW_INVENTORY',
  RECEIVE_STOCK: 'RECEIVE_STOCK',
  // Billing permissions
  CREATE_INVOICE: 'CREATE_INVOICE',
  VIEW_INVOICE: 'VIEW_INVOICE',
  RECEIVE_PAYMENT: 'RECEIVE_PAYMENT',
  // Staff permissions
  VIEW_STAFF: 'VIEW_STAFF',
  CREATE_STAFF: 'CREATE_STAFF',
  UPDATE_STAFF: 'UPDATE_STAFF',
};
