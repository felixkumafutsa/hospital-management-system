/*
  Warnings:

  - The values [LAB_PENDING,PHARMACY] on the enum `VisitStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `roomNumber` on the `Visit` table. All the data in the column will be lost.
  - Added the required column `module` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TriageLevel" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');

-- CreateEnum
CREATE TYPE "TimeOffStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_REMINDER', 'LAB_RESULT_AVAILABLE', 'PRESCRIPTION_READY', 'PAYMENT_DUE', 'FOLLOW_UP_REMINDER', 'EMERGENCY_ALERT', 'ADMISSION_UPDATE', 'DISCHARGE_SUMMARY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterEnum
BEGIN;
CREATE TYPE "VisitStatus_new" AS ENUM ('REGISTERED', 'WAITING_FOR_CONSULTATION', 'TRIAGED', 'CONSULTING', 'AWAITING_LABORATORY', 'RESULTS_AVAILABLE', 'AWAITING_PHARMACY', 'ADMITTED', 'MATERNITY', 'EMERGENCY', 'REFERRED', 'BILLING', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Visit" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Visit" ALTER COLUMN "status" TYPE "VisitStatus_new" USING ("status"::text::"VisitStatus_new");
ALTER TYPE "VisitStatus" RENAME TO "VisitStatus_old";
ALTER TYPE "VisitStatus_new" RENAME TO "VisitStatus";
DROP TYPE "VisitStatus_old";
ALTER TABLE "Visit" ALTER COLUMN "status" SET DEFAULT 'REGISTERED';
COMMIT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "module" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "assignedDoctorId" TEXT,
ADD COLUMN     "followUpStatus" "FollowUpStatus";

-- AlterTable
ALTER TABLE "Visit" DROP COLUMN "roomNumber",
ADD COLUMN     "attendingDoctorId" TEXT,
ADD COLUMN     "bedNumber" TEXT,
ADD COLUMN     "emergencyNotes" TEXT,
ADD COLUMN     "expectedDischargeDate" TIMESTAMP(3),
ADD COLUMN     "triageLevel" "TriageLevel",
ADD COLUMN     "ward" TEXT;

-- CreateTable
CREATE TABLE "StaffSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shiftDate" TIMESTAMP(3) NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "department" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOffRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "TimeOffStatus" NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeOffRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "totalBeds" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bed" (
    "id" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "bedNumber" TEXT NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "visitId" TEXT,
    "assignedDoctorId" TEXT,
    "followUpDate" TIMESTAMP(3) NOT NULL,
    "followUpReason" TEXT NOT NULL,
    "followUpNotes" TEXT,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'SCHEDULED',
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyCase" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "triageLevel" "TriageLevel" NOT NULL,
    "chiefComplaint" TEXT NOT NULL,
    "vitalSigns" TEXT,
    "consciousness" TEXT,
    "breathing" TEXT,
    "circulation" TEXT,
    "disability" TEXT,
    "exposure" TEXT,
    "treatmentNotes" TEXT,
    "attendingDoctorId" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentVerification" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "verificationCode" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "receiptUrl" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "relatedId" TEXT,
    "relatedType" TEXT,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "smsStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DischargeSummary" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "dischargeDate" TIMESTAMP(3) NOT NULL,
    "dischargeReason" TEXT NOT NULL,
    "finalDiagnosis" TEXT NOT NULL,
    "treatmentSummary" TEXT NOT NULL,
    "medicationsOnDischarge" TEXT[],
    "followUpInstructions" TEXT NOT NULL,
    "dischargeBy" TEXT NOT NULL,
    "attendingDoctorId" TEXT,
    "complications" TEXT,
    "patientCondition" TEXT NOT NULL,
    "isSignedOff" BOOLEAN NOT NULL DEFAULT false,
    "signedOffAt" TIMESTAMP(3),
    "signedOffBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DischargeSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffSchedule_userId_shiftDate_idx" ON "StaffSchedule"("userId", "shiftDate");

-- CreateIndex
CREATE INDEX "StaffSchedule_department_shiftDate_idx" ON "StaffSchedule"("department", "shiftDate");

-- CreateIndex
CREATE INDEX "TimeOffRequest_userId_idx" ON "TimeOffRequest"("userId");

-- CreateIndex
CREATE INDEX "TimeOffRequest_status_idx" ON "TimeOffRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Ward_name_key" ON "Ward"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Bed_wardId_bedNumber_key" ON "Bed"("wardId", "bedNumber");

-- CreateIndex
CREATE INDEX "FollowUp_patientId_idx" ON "FollowUp"("patientId");

-- CreateIndex
CREATE INDEX "FollowUp_assignedDoctorId_idx" ON "FollowUp"("assignedDoctorId");

-- CreateIndex
CREATE INDEX "FollowUp_followUpDate_idx" ON "FollowUp"("followUpDate");

-- CreateIndex
CREATE INDEX "FollowUp_status_idx" ON "FollowUp"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyCase_visitId_key" ON "EmergencyCase"("visitId");

-- CreateIndex
CREATE INDEX "EmergencyCase_visitId_idx" ON "EmergencyCase"("visitId");

-- CreateIndex
CREATE INDEX "EmergencyCase_triageLevel_idx" ON "EmergencyCase"("triageLevel");

-- CreateIndex
CREATE INDEX "EmergencyCase_isResolved_idx" ON "EmergencyCase"("isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentVerification_paymentId_key" ON "PaymentVerification"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentVerification_transactionId_key" ON "PaymentVerification"("transactionId");

-- CreateIndex
CREATE INDEX "PaymentVerification_paymentId_idx" ON "PaymentVerification"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentVerification_transactionId_idx" ON "PaymentVerification"("transactionId");

-- CreateIndex
CREATE INDEX "PaymentVerification_isVerified_idx" ON "PaymentVerification"("isVerified");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DischargeSummary_visitId_key" ON "DischargeSummary"("visitId");

-- CreateIndex
CREATE INDEX "DischargeSummary_visitId_idx" ON "DischargeSummary"("visitId");

-- CreateIndex
CREATE INDEX "DischargeSummary_patientId_idx" ON "DischargeSummary"("patientId");

-- CreateIndex
CREATE INDEX "DischargeSummary_dischargeDate_idx" ON "DischargeSummary"("dischargeDate");

-- AddForeignKey
ALTER TABLE "StaffSchedule" ADD CONSTRAINT "StaffSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_assignedDoctorId_fkey" FOREIGN KEY ("assignedDoctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyCase" ADD CONSTRAINT "EmergencyCase_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyCase" ADD CONSTRAINT "EmergencyCase_attendingDoctorId_fkey" FOREIGN KEY ("attendingDoctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVerification" ADD CONSTRAINT "PaymentVerification_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DischargeSummary" ADD CONSTRAINT "DischargeSummary_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DischargeSummary" ADD CONSTRAINT "DischargeSummary_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DischargeSummary" ADD CONSTRAINT "DischargeSummary_attendingDoctorId_fkey" FOREIGN KEY ("attendingDoctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
