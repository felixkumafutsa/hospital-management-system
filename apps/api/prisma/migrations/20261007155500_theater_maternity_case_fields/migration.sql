ALTER TABLE "SurgicalProcedure"
  DROP CONSTRAINT IF EXISTS "SurgicalProcedure_theaterId_fkey";

ALTER TABLE "SurgicalProcedure"
  ADD CONSTRAINT "SurgicalProcedure_theaterId_fkey"
  FOREIGN KEY ("theaterId") REFERENCES "Theater"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
