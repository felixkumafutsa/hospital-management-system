-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "admissionDate" TIMESTAMP(3),
ADD COLUMN     "dailyRate" DECIMAL(10,2),
ADD COLUMN     "dischargeDate" TIMESTAMP(3),
ADD COLUMN     "roomNumber" TEXT,
ADD COLUMN     "stayDuration" INTEGER;
