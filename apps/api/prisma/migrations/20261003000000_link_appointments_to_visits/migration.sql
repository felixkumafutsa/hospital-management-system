ALTER TABLE "Appointment" ADD COLUMN "visitId" TEXT;

CREATE INDEX "Appointment_visitId_idx" ON "Appointment"("visitId");

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_visitId_fkey"
FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;