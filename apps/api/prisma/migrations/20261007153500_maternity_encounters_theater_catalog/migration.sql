ALTER TYPE "VisitType" ADD VALUE 'DELIVERY';

INSERT INTO "Role" ("id", "name", "displayName")
VALUES (gen_random_uuid()::text, 'ANESTHETIST', 'Anesthetist')
ON CONFLICT ("name") DO NOTHING;

WITH theater_permission AS (
  INSERT INTO "Permission" ("id", "action", "resource")
  VALUES (gen_random_uuid()::text, 'MANAGE_THEATER', 'theater')
  ON CONFLICT ("action", "resource") DO UPDATE SET "action" = EXCLUDED."action"
  RETURNING "id"
)
INSERT INTO "_PermissionToRole" ("A", "B")
SELECT theater_permission."id", "Role"."id"
FROM theater_permission
CROSS JOIN "Role"
WHERE "Role"."name" IN ('ADMINISTRATOR', 'DOCTOR', 'NURSE', 'ANESTHETIST')
ON CONFLICT ("A", "B") DO NOTHING;

CREATE TYPE "MaternityStatus" AS ENUM ('ACTIVE', 'DELIVERED', 'CLOSED');

DROP INDEX "MaternityProfile_patientId_key";
ALTER TABLE "MaternityProfile"
  ADD COLUMN "lastMenstrualPeriod" TIMESTAMP(3),
  ADD COLUMN "gravida" INTEGER,
  ADD COLUMN "parity" INTEGER,
  ADD COLUMN "status" "MaternityStatus" NOT NULL DEFAULT 'ACTIVE';
CREATE INDEX "MaternityProfile_patientId_status_idx"
  ON "MaternityProfile"("patientId", "status");

ALTER TABLE "AncRecord" ADD COLUMN "visitId" TEXT;
CREATE UNIQUE INDEX "AncRecord_visitId_key" ON "AncRecord"("visitId");
ALTER TABLE "AncRecord"
  ADD CONSTRAINT "AncRecord_visitId_fkey"
  FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DeliveryRecord" ADD COLUMN "visitId" TEXT;
DROP INDEX "DeliveryRecord_maternityProfileId_key";
CREATE UNIQUE INDEX "DeliveryRecord_visitId_key" ON "DeliveryRecord"("visitId");
ALTER TABLE "DeliveryRecord"
  ADD CONSTRAINT "DeliveryRecord_visitId_fkey"
  FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PostnatalRecord" ADD COLUMN "visitId" TEXT;
CREATE UNIQUE INDEX "PostnatalRecord_visitId_key" ON "PostnatalRecord"("visitId");
ALTER TABLE "PostnatalRecord"
  ADD CONSTRAINT "PostnatalRecord_visitId_fkey"
  FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Theater" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Theater_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Theater_name_key" ON "Theater"("name");

CREATE TABLE "ProcedureCatalog" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "durationMinutes" INTEGER NOT NULL DEFAULT 60,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProcedureCatalog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProcedureCatalog_code_key" ON "ProcedureCatalog"("code");
CREATE UNIQUE INDEX "ProcedureCatalog_name_key" ON "ProcedureCatalog"("name");

CREATE TABLE "SurgicalProcedure" (
  "id" TEXT NOT NULL,
  "visitId" TEXT NOT NULL,
  "catalogId" TEXT,
  "maternityProfileId" TEXT,
  "procedureName" TEXT NOT NULL,
  "procedureDate" TIMESTAMP(3) NOT NULL,
  "procedureFee" DECIMAL(10,2),
  "theaterId" TEXT,
  "surgeonId" TEXT,
  "anesthetistId" TEXT,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SurgicalProcedure_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SurgicalProcedure_visitId_key" ON "SurgicalProcedure"("visitId");
ALTER TABLE "SurgicalProcedure"
  ADD CONSTRAINT "SurgicalProcedure_visitId_fkey"
    FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "SurgicalProcedure_theaterId_fkey"
    FOREIGN KEY ("theaterId") REFERENCES "Theater"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "SurgicalProcedure_catalogId_fkey"
    FOREIGN KEY ("catalogId") REFERENCES "ProcedureCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "SurgicalProcedure_maternityProfileId_fkey"
    FOREIGN KEY ("maternityProfileId") REFERENCES "MaternityProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "SurgicalProcedure_surgeonId_fkey"
    FOREIGN KEY ("surgeonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "SurgicalProcedure_anesthetistId_fkey"
    FOREIGN KEY ("anesthetistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SurgicalTeam" (
  "id" TEXT NOT NULL,
  "procedureId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SurgicalTeam_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SurgicalTeam_procedureId_idx" ON "SurgicalTeam"("procedureId");
ALTER TABLE "SurgicalTeam"
  ADD CONSTRAINT "SurgicalTeam_procedureId_fkey"
  FOREIGN KEY ("procedureId") REFERENCES "SurgicalProcedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
