import { z } from 'zod';
export declare enum Gender {
    FEMALE = "FEMALE",
    MALE = "MALE",
    OTHER = "OTHER"
}
export declare enum VisitStatus {
    REGISTERED = "REGISTERED",
    TRIAGED = "TRIAGED",
    CONSULTING = "CONSULTING",
    LAB_PENDING = "LAB_PENDING",
    PHARMACY = "PHARMACY",
    BILLING = "BILLING",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum VisitType {
    OUTPATIENT = "OUTPATIENT",
    INPATIENT = "INPATIENT",
    ANC = "ANC",
    POSTNATAL = "POSTNATAL",
    EMERGENCY = "EMERGENCY"
}
export declare enum LabStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    REVIEWED = "REVIEWED",
    CANCELLED = "CANCELLED"
}
export declare enum Priority {
    ROUTINE = "ROUTINE",
    URGENT = "URGENT",
    STAT = "STAT"
}
export declare enum PrescriptionStatus {
    PENDING = "PENDING",
    PARTIAL = "PARTIAL",
    DISPENSED = "DISPENSED",
    CANCELLED = "CANCELLED"
}
export declare enum InvoiceStatus {
    DRAFT = "DRAFT",
    SENT = "SENT",
    UNPAID = "UNPAID",
    PAID = "PAID",
    PARTIAL = "PARTIAL",
    OVERDUE = "OVERDUE",
    CANCELLED = "CANCELLED",
    WAIVED = "WAIVED"
}
export declare enum PaymentMethod {
    CASH = "CASH",
    AIRTEL_MONEY = "AIRTEL_MONEY",
    TNM_MPAMBA = "TNM_MPAMBA",
    BANK_TRANSFER = "BANK_TRANSFER",
    INSURANCE = "INSURANCE",
    WAIVER = "WAIVER"
}
export declare enum AppointmentStatus {
    SCHEDULED = "SCHEDULED",
    CHECKED_IN = "CHECKED_IN",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    NO_SHOW = "NO_SHOW"
}
export declare enum DeliveryMethod {
    VAGINAL = "VAGINAL",
    CAESAREAN = "CAESAREAN",
    VACUUM = "VACUUM",
    FORCEPS = "FORCEPS",
    OTHER = "OTHER"
}
export declare enum RiskLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum ShiftType {
    MORNING = "MORNING",
    AFTERNOON = "AFTERNOON",
    NIGHT = "NIGHT",
    DAY = "DAY",
    ON_CALL = "ON_CALL"
}
export declare enum RoleType {
    ADMINISTRATOR = "ADMINISTRATOR",
    MD = "MD",
    DOCTOR = "DOCTOR",
    NURSE = "NURSE",
    RECEPTIONIST = "RECEPTIONIST",
    LAB_TECH = "LAB_TECH",
    PHARMACIST = "PHARMACIST",
    CASHIER = "CASHIER"
}
export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}
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
export declare const CreatePatientSchema: z.ZodObject<{
    nationalId: z.ZodOptional<z.ZodString>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    dateOfBirth: z.ZodString;
    gender: z.ZodEnum<typeof Gender>;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    nextOfKinName: z.ZodOptional<z.ZodString>;
    nextOfKinPhone: z.ZodOptional<z.ZodString>;
    nextOfKinRelation: z.ZodOptional<z.ZodString>;
    bloodGroup: z.ZodOptional<z.ZodString>;
    allergies: z.ZodOptional<z.ZodArray<z.ZodString>>;
    insuranceProvider: z.ZodOptional<z.ZodString>;
    insuranceNumber: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
export declare const CreateAncSchema: z.ZodObject<{
    patientId: z.ZodString;
    gestationWeeks: z.ZodNumber;
    weightKg: z.ZodOptional<z.ZodNumber>;
    bpSystolic: z.ZodOptional<z.ZodNumber>;
    bpDiastolic: z.ZodOptional<z.ZodNumber>;
    fetalHeartRate: z.ZodOptional<z.ZodNumber>;
    fundusHeight: z.ZodOptional<z.ZodNumber>;
    presentation: z.ZodOptional<z.ZodString>;
    ultrasoundNotes: z.ZodOptional<z.ZodString>;
    riskFactors: z.ZodOptional<z.ZodArray<z.ZodString>>;
    notes: z.ZodOptional<z.ZodString>;
    nextVisitDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
export declare const CreateDeliverySchema: z.ZodObject<{
    patientId: z.ZodString;
    deliveryDate: z.ZodString;
    deliveryMethod: z.ZodEnum<typeof DeliveryMethod>;
    gestationWeeks: z.ZodOptional<z.ZodNumber>;
    babyWeightKg: z.ZodOptional<z.ZodNumber>;
    babyGender: z.ZodOptional<z.ZodEnum<typeof Gender>>;
    apgarScore1Min: z.ZodOptional<z.ZodNumber>;
    apgarScore5Min: z.ZodOptional<z.ZodNumber>;
    complications: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
export declare const CreatePostnatalSchema: z.ZodObject<{
    patientId: z.ZodString;
    deliveryId: z.ZodString;
    motherStatus: z.ZodOptional<z.ZodString>;
    babyStatus: z.ZodOptional<z.ZodString>;
    breastfeeding: z.ZodOptional<z.ZodBoolean>;
    immunizationGiven: z.ZodOptional<z.ZodArray<z.ZodString>>;
    notes: z.ZodOptional<z.ZodString>;
    nextVisitDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
export declare const CreateScheduleSchema: z.ZodObject<{
    userId: z.ZodString;
    shiftDate: z.ZodString;
    shiftType: z.ZodEnum<typeof ShiftType>;
    startTime: z.ZodString;
    endTime: z.ZodString;
    department: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
export declare const CreateTimeOffSchema: z.ZodObject<{
    startDate: z.ZodString;
    endDate: z.ZodString;
    reason: z.ZodString;
}, z.core.$strip>;
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
export declare const QueryKeys: {
    readonly patients: {
        readonly all: readonly ["patients"];
        readonly list: (page: number, limit: number, filters?: Record<string, any>) => readonly ["patients", "list", number, number, Record<string, any> | undefined];
        readonly detail: (id: string) => readonly ["patients", "detail", string];
        readonly search: (query: string) => readonly ["patients", "search", string];
    };
    readonly maternity: {
        readonly ancRecords: {
            readonly all: readonly ["anc"];
            readonly patient: (patientId: string) => readonly ["anc", "patient", string];
        };
        readonly deliveryRecords: {
            readonly all: readonly ["delivery"];
            readonly patient: (patientId: string) => readonly ["delivery", "patient", string];
        };
        readonly postnatalRecords: {
            readonly all: readonly ["postnatal"];
            readonly patient: (patientId: string) => readonly ["postnatal", "patient", string];
        };
    };
    readonly scheduling: {
        readonly schedules: {
            readonly all: readonly ["schedules"];
            readonly user: (userId: string, month?: string) => readonly ["schedules", "user", string, string | undefined];
            readonly department: (department: string, date: string) => readonly ["schedules", "department", string, string];
        };
        readonly timeOff: {
            readonly all: readonly ["timeoff"];
            readonly pending: readonly ["timeoff", "pending"];
        };
    };
    readonly appointments: {
        readonly all: readonly ["appointments"];
        readonly date: (date: string) => readonly ["appointments", "date", string];
        readonly doctor: (doctorId: string) => readonly ["appointments", "doctor", string];
    };
};
export declare const ANTENATAL_VISIT_SCHEDULE: {
    week: number;
    description: string;
}[];
export declare const POSTNATAL_VISIT_SCHEDULE: {
    daysAfterBirth: number;
    description: string;
}[];
export declare const MATERNITY_RISK_FACTORS: string[];
export declare const SHIFT_TIMES: {
    MORNING: {
        start: string;
        end: string;
        name: string;
    };
    AFTERNOON: {
        start: string;
        end: string;
        name: string;
    };
    NIGHT: {
        start: string;
        end: string;
        name: string;
    };
    DAY: {
        start: string;
        end: string;
        name: string;
    };
    ON_CALL: {
        start: string;
        end: string;
        name: string;
    };
};
export declare const DEPARTMENTS: string[];
export declare const PERMISSIONS: {
    CREATE_PATIENT: string;
    VIEW_PATIENT: string;
    UPDATE_PATIENT: string;
    CREATE_ANC: string;
    VIEW_ANC: string;
    UPDATE_ANC: string;
    CREATE_DELIVERY: string;
    VIEW_DELIVERY: string;
    CREATE_POSTNATAL: string;
    VIEW_POSTNATAL: string;
    CREATE_SCHEDULE: string;
    VIEW_SCHEDULE: string;
    UPDATE_SCHEDULE: string;
    APPROVE_TIMEOFF: string;
    CREATE_VISIT: string;
    VIEW_VISIT: string;
    UPDATE_VISIT: string;
    CREATE_LAB_REQUEST: string;
    VIEW_LAB_REQUEST: string;
    SUBMIT_LAB_RESULTS: string;
    DISPENSE_MEDICATION: string;
    VIEW_INVENTORY: string;
    RECEIVE_STOCK: string;
    CREATE_INVOICE: string;
    VIEW_INVOICE: string;
    RECEIVE_PAYMENT: string;
    VIEW_STAFF: string;
    CREATE_STAFF: string;
    UPDATE_STAFF: string;
};
