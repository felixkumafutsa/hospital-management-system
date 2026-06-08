"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSIONS = exports.DEPARTMENTS = exports.SHIFT_TIMES = exports.MATERNITY_RISK_FACTORS = exports.POSTNATAL_VISIT_SCHEDULE = exports.ANTENATAL_VISIT_SCHEDULE = exports.QueryKeys = exports.CreateTimeOffSchema = exports.CreateScheduleSchema = exports.CreatePostnatalSchema = exports.CreateDeliverySchema = exports.CreateAncSchema = exports.CreatePatientSchema = exports.RoleType = exports.ShiftType = exports.RiskLevel = exports.DeliveryMethod = exports.AppointmentStatus = exports.PaymentMethod = exports.InvoiceStatus = exports.PrescriptionStatus = exports.Priority = exports.LabStatus = exports.VisitType = exports.VisitStatus = exports.Gender = void 0;
const zod_1 = require("zod");
var Gender;
(function (Gender) {
    Gender["FEMALE"] = "FEMALE";
    Gender["MALE"] = "MALE";
    Gender["OTHER"] = "OTHER";
})(Gender || (exports.Gender = Gender = {}));
var VisitStatus;
(function (VisitStatus) {
    VisitStatus["REGISTERED"] = "REGISTERED";
    VisitStatus["TRIAGED"] = "TRIAGED";
    VisitStatus["CONSULTING"] = "CONSULTING";
    VisitStatus["LAB_PENDING"] = "LAB_PENDING";
    VisitStatus["PHARMACY"] = "PHARMACY";
    VisitStatus["BILLING"] = "BILLING";
    VisitStatus["COMPLETED"] = "COMPLETED";
    VisitStatus["CANCELLED"] = "CANCELLED";
})(VisitStatus || (exports.VisitStatus = VisitStatus = {}));
var VisitType;
(function (VisitType) {
    VisitType["OUTPATIENT"] = "OUTPATIENT";
    VisitType["INPATIENT"] = "INPATIENT";
    VisitType["ANC"] = "ANC";
    VisitType["POSTNATAL"] = "POSTNATAL";
    VisitType["EMERGENCY"] = "EMERGENCY";
})(VisitType || (exports.VisitType = VisitType = {}));
var LabStatus;
(function (LabStatus) {
    LabStatus["PENDING"] = "PENDING";
    LabStatus["PROCESSING"] = "PROCESSING";
    LabStatus["COMPLETED"] = "COMPLETED";
    LabStatus["REVIEWED"] = "REVIEWED";
    LabStatus["CANCELLED"] = "CANCELLED";
})(LabStatus || (exports.LabStatus = LabStatus = {}));
var Priority;
(function (Priority) {
    Priority["ROUTINE"] = "ROUTINE";
    Priority["URGENT"] = "URGENT";
    Priority["STAT"] = "STAT";
})(Priority || (exports.Priority = Priority = {}));
var PrescriptionStatus;
(function (PrescriptionStatus) {
    PrescriptionStatus["PENDING"] = "PENDING";
    PrescriptionStatus["PARTIAL"] = "PARTIAL";
    PrescriptionStatus["DISPENSED"] = "DISPENSED";
    PrescriptionStatus["CANCELLED"] = "CANCELLED";
})(PrescriptionStatus || (exports.PrescriptionStatus = PrescriptionStatus = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["SENT"] = "SENT";
    InvoiceStatus["UNPAID"] = "UNPAID";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["PARTIAL"] = "PARTIAL";
    InvoiceStatus["OVERDUE"] = "OVERDUE";
    InvoiceStatus["CANCELLED"] = "CANCELLED";
    InvoiceStatus["WAIVED"] = "WAIVED";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["AIRTEL_MONEY"] = "AIRTEL_MONEY";
    PaymentMethod["TNM_MPAMBA"] = "TNM_MPAMBA";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["INSURANCE"] = "INSURANCE";
    PaymentMethod["WAIVER"] = "WAIVER";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["SCHEDULED"] = "SCHEDULED";
    AppointmentStatus["CHECKED_IN"] = "CHECKED_IN";
    AppointmentStatus["COMPLETED"] = "COMPLETED";
    AppointmentStatus["CANCELLED"] = "CANCELLED";
    AppointmentStatus["NO_SHOW"] = "NO_SHOW";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var DeliveryMethod;
(function (DeliveryMethod) {
    DeliveryMethod["VAGINAL"] = "VAGINAL";
    DeliveryMethod["CAESAREAN"] = "CAESAREAN";
    DeliveryMethod["VACUUM"] = "VACUUM";
    DeliveryMethod["FORCEPS"] = "FORCEPS";
    DeliveryMethod["OTHER"] = "OTHER";
})(DeliveryMethod || (exports.DeliveryMethod = DeliveryMethod = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "LOW";
    RiskLevel["MEDIUM"] = "MEDIUM";
    RiskLevel["HIGH"] = "HIGH";
    RiskLevel["CRITICAL"] = "CRITICAL";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var ShiftType;
(function (ShiftType) {
    ShiftType["MORNING"] = "MORNING";
    ShiftType["AFTERNOON"] = "AFTERNOON";
    ShiftType["NIGHT"] = "NIGHT";
    ShiftType["DAY"] = "DAY";
    ShiftType["ON_CALL"] = "ON_CALL";
})(ShiftType || (exports.ShiftType = ShiftType = {}));
var RoleType;
(function (RoleType) {
    RoleType["ADMINISTRATOR"] = "ADMINISTRATOR";
    RoleType["MD"] = "MD";
    RoleType["DOCTOR"] = "DOCTOR";
    RoleType["NURSE"] = "NURSE";
    RoleType["RECEPTIONIST"] = "RECEPTIONIST";
    RoleType["LAB_TECH"] = "LAB_TECH";
    RoleType["PHARMACIST"] = "PHARMACIST";
    RoleType["CASHIER"] = "CASHIER";
})(RoleType || (exports.RoleType = RoleType = {}));
exports.CreatePatientSchema = zod_1.z.object({
    nationalId: zod_1.z.string().optional(),
    firstName: zod_1.z.string().min(2).max(100),
    lastName: zod_1.z.string().min(2).max(100),
    dateOfBirth: zod_1.z.string(),
    gender: zod_1.z.nativeEnum(Gender),
    phone: zod_1.z.string().min(10),
    email: zod_1.z.string().email().optional(),
    address: zod_1.z.string().optional(),
    nextOfKinName: zod_1.z.string().optional(),
    nextOfKinPhone: zod_1.z.string().optional(),
    nextOfKinRelation: zod_1.z.string().optional(),
    bloodGroup: zod_1.z.string().optional(),
    allergies: zod_1.z.array(zod_1.z.string()).optional(),
    insuranceProvider: zod_1.z.string().optional(),
    insuranceNumber: zod_1.z.string().optional(),
});
exports.CreateAncSchema = zod_1.z.object({
    patientId: zod_1.z.string().uuid(),
    gestationWeeks: zod_1.z.number().int().min(4).max(45),
    weightKg: zod_1.z.number().optional(),
    bpSystolic: zod_1.z.number().int().optional(),
    bpDiastolic: zod_1.z.number().int().optional(),
    fetalHeartRate: zod_1.z.number().int().optional(),
    fundusHeight: zod_1.z.number().optional(),
    presentation: zod_1.z.string().optional(),
    ultrasoundNotes: zod_1.z.string().optional(),
    riskFactors: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().optional(),
    nextVisitDate: zod_1.z.string().optional(),
});
exports.CreateDeliverySchema = zod_1.z.object({
    patientId: zod_1.z.string().uuid(),
    deliveryDate: zod_1.z.string(),
    deliveryMethod: zod_1.z.nativeEnum(DeliveryMethod),
    gestationWeeks: zod_1.z.number().int().min(20).max(45).optional(),
    babyWeightKg: zod_1.z.number().optional(),
    babyGender: zod_1.z.nativeEnum(Gender).optional(),
    apgarScore1Min: zod_1.z.number().int().min(0).max(10).optional(),
    apgarScore5Min: zod_1.z.number().int().min(0).max(10).optional(),
    complications: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.CreatePostnatalSchema = zod_1.z.object({
    patientId: zod_1.z.string().uuid(),
    deliveryId: zod_1.z.string().uuid(),
    motherStatus: zod_1.z.string().optional(),
    babyStatus: zod_1.z.string().optional(),
    breastfeeding: zod_1.z.boolean().optional(),
    immunizationGiven: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().optional(),
    nextVisitDate: zod_1.z.string().optional(),
});
exports.CreateScheduleSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    shiftDate: zod_1.z.string(),
    shiftType: zod_1.z.nativeEnum(ShiftType),
    startTime: zod_1.z.string(),
    endTime: zod_1.z.string(),
    department: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.CreateTimeOffSchema = zod_1.z.object({
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    reason: zod_1.z.string().min(10),
});
exports.QueryKeys = {
    patients: {
        all: ['patients'],
        list: (page, limit, filters) => ['patients', 'list', page, limit, filters],
        detail: (id) => ['patients', 'detail', id],
        search: (query) => ['patients', 'search', query],
    },
    maternity: {
        ancRecords: {
            all: ['anc'],
            patient: (patientId) => ['anc', 'patient', patientId],
        },
        deliveryRecords: {
            all: ['delivery'],
            patient: (patientId) => ['delivery', 'patient', patientId],
        },
        postnatalRecords: {
            all: ['postnatal'],
            patient: (patientId) => ['postnatal', 'patient', patientId],
        },
    },
    scheduling: {
        schedules: {
            all: ['schedules'],
            user: (userId, month) => ['schedules', 'user', userId, month],
            department: (department, date) => ['schedules', 'department', department, date],
        },
        timeOff: {
            all: ['timeoff'],
            pending: ['timeoff', 'pending'],
        },
    },
    appointments: {
        all: ['appointments'],
        date: (date) => ['appointments', 'date', date],
        doctor: (doctorId) => ['appointments', 'doctor', doctorId],
    },
};
exports.ANTENATAL_VISIT_SCHEDULE = [
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
exports.POSTNATAL_VISIT_SCHEDULE = [
    { daysAfterBirth: 3, description: 'Third day checkup' },
    { daysAfterBirth: 7, description: 'One week checkup' },
    { daysAfterBirth: 42, description: 'Six weeks postnatal visit' },
    { daysAfterBirth: 180, description: 'Six month checkup' },
];
exports.MATERNITY_RISK_FACTORS = [
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
exports.SHIFT_TIMES = {
    [ShiftType.MORNING]: { start: '07:00', end: '15:00', name: 'Morning Shift' },
    [ShiftType.AFTERNOON]: { start: '15:00', end: '23:00', name: 'Afternoon Shift' },
    [ShiftType.NIGHT]: { start: '23:00', end: '07:00', name: 'Night Shift' },
    [ShiftType.DAY]: { start: '08:00', end: '17:00', name: 'Day Shift' },
    [ShiftType.ON_CALL]: { start: '00:00', end: '23:59', name: 'On Call' },
};
exports.DEPARTMENTS = [
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
exports.PERMISSIONS = {
    CREATE_PATIENT: 'CREATE_PATIENT',
    VIEW_PATIENT: 'VIEW_PATIENT',
    UPDATE_PATIENT: 'UPDATE_PATIENT',
    CREATE_ANC: 'CREATE_ANC',
    VIEW_ANC: 'VIEW_ANC',
    UPDATE_ANC: 'UPDATE_ANC',
    CREATE_DELIVERY: 'CREATE_DELIVERY',
    VIEW_DELIVERY: 'VIEW_DELIVERY',
    CREATE_POSTNATAL: 'CREATE_POSTNATAL',
    VIEW_POSTNATAL: 'VIEW_POSTNATAL',
    CREATE_SCHEDULE: 'CREATE_SCHEDULE',
    VIEW_SCHEDULE: 'VIEW_SCHEDULE',
    UPDATE_SCHEDULE: 'UPDATE_SCHEDULE',
    APPROVE_TIMEOFF: 'APPROVE_TIMEOFF',
    CREATE_VISIT: 'CREATE_VISIT',
    VIEW_VISIT: 'VIEW_VISIT',
    UPDATE_VISIT: 'UPDATE_VISIT',
    CREATE_LAB_REQUEST: 'CREATE_LAB_REQUEST',
    VIEW_LAB_REQUEST: 'VIEW_LAB_REQUEST',
    SUBMIT_LAB_RESULTS: 'SUBMIT_LAB_RESULTS',
    DISPENSE_MEDICATION: 'DISPENSE_MEDICATION',
    VIEW_INVENTORY: 'VIEW_INVENTORY',
    RECEIVE_STOCK: 'RECEIVE_STOCK',
    CREATE_INVOICE: 'CREATE_INVOICE',
    VIEW_INVOICE: 'VIEW_INVOICE',
    RECEIVE_PAYMENT: 'RECEIVE_PAYMENT',
    VIEW_STAFF: 'VIEW_STAFF',
    CREATE_STAFF: 'CREATE_STAFF',
    UPDATE_STAFF: 'UPDATE_STAFF',
};
//# sourceMappingURL=index.js.map