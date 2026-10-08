/*
  Warnings:

  - Added the required column `endTime` to the `StaffSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `StaffSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ShiftType" ADD VALUE 'DAY';
ALTER TYPE "ShiftType" ADD VALUE 'ON_CALL';

-- AlterTable
ALTER TABLE "StaffSchedule" ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL,
ALTER COLUMN "department" DROP NOT NULL;
