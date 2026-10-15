-- CreateEnum
CREATE TYPE "InvoiceItemCategory" AS ENUM ('CONSULTATION', 'PROCEDURE', 'LAB_TEST', 'MEDICATION', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('UNPAID', 'PAID', 'PARTIAL', 'VOID');
ALTER TABLE "Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "InvoiceStatus_old";
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'UNPAID';
COMMIT;

-- AlterEnum
ALTER TYPE "VisitStatus" ADD VALUE IF NOT EXISTS 'AWAITING_PAYMENT';
ALTER TYPE "VisitStatus" ADD VALUE IF NOT EXISTS 'AWAITING_SURGERY';

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_visitId_fkey";

-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT IF EXISTS "InvoiceItem_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT IF EXISTS "Service_categoryId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Invoice_status_idx";

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "visitId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN IF EXISTS "serviceId",
ADD COLUMN "category" "InvoiceItemCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN "unitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "quantity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Medicine" DROP COLUMN IF EXISTS "category";

-- DropTable
DROP TABLE IF EXISTS "Service";

-- DropTable
DROP TABLE IF EXISTS "ServiceCategory";

-- CreateTable
CREATE TABLE IF NOT EXISTS "DutyRoster" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutyRoster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DutyRoster_staffId_idx" ON "DutyRoster"("staffId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invoice_visitId_idx" ON "Invoice"("visitId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DutyRoster_staffId_fkey'
    ) THEN
        ALTER TABLE "DutyRoster" ADD CONSTRAINT "DutyRoster_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_visitId_fkey'
    ) THEN
        ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

