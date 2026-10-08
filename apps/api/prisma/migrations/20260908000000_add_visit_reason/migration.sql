-- Add the visit reason introduced in the Prisma schema without changing existing visits.
ALTER TABLE "Visit" ADD COLUMN "reasonForVisit" TEXT;
