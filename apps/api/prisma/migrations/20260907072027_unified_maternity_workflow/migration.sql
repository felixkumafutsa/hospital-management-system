/*
  Warnings:

  - You are about to drop the column `patientId` on the `AncRecord` table. All the data in the column will be lost.
  - You are about to drop the column `patientId` on the `DeliveryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `patientId` on the `PostnatalRecord` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[maternityProfileId]` on the table `DeliveryRecord` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `maternityProfileId` to the `AncRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maternityProfileId` to the `DeliveryRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maternityProfileId` to the `PostnatalRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AncRecord" DROP CONSTRAINT "AncRecord_patientId_fkey";

-- DropForeignKey
ALTER TABLE "DeliveryRecord" DROP CONSTRAINT "DeliveryRecord_patientId_fkey";

-- DropForeignKey
ALTER TABLE "PostnatalRecord" DROP CONSTRAINT "PostnatalRecord_patientId_fkey";

-- DropIndex
DROP INDEX "AncRecord_patientId_idx";

-- DropIndex
DROP INDEX "DeliveryRecord_patientId_idx";

-- DropIndex
DROP INDEX "PostnatalRecord_patientId_idx";

-- AlterTable
ALTER TABLE "AncRecord" DROP COLUMN "patientId",
ADD COLUMN     "maternityProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DeliveryRecord" DROP COLUMN "patientId",
ADD COLUMN     "maternityProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PostnatalRecord" DROP COLUMN "patientId",
ADD COLUMN     "maternityProfileId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MaternityProfile" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "estimatedDueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaternityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaternityProfile_patientId_key" ON "MaternityProfile"("patientId");

-- CreateIndex
CREATE INDEX "AncRecord_maternityProfileId_idx" ON "AncRecord"("maternityProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRecord_maternityProfileId_key" ON "DeliveryRecord"("maternityProfileId");

-- CreateIndex
CREATE INDEX "DeliveryRecord_maternityProfileId_idx" ON "DeliveryRecord"("maternityProfileId");

-- CreateIndex
CREATE INDEX "PostnatalRecord_maternityProfileId_idx" ON "PostnatalRecord"("maternityProfileId");

-- AddForeignKey
ALTER TABLE "MaternityProfile" ADD CONSTRAINT "MaternityProfile_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AncRecord" ADD CONSTRAINT "AncRecord_maternityProfileId_fkey" FOREIGN KEY ("maternityProfileId") REFERENCES "MaternityProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRecord" ADD CONSTRAINT "DeliveryRecord_maternityProfileId_fkey" FOREIGN KEY ("maternityProfileId") REFERENCES "MaternityProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostnatalRecord" ADD CONSTRAINT "PostnatalRecord_maternityProfileId_fkey" FOREIGN KEY ("maternityProfileId") REFERENCES "MaternityProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
