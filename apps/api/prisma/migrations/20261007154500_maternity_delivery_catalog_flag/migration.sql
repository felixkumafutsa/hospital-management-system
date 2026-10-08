ALTER TABLE "ProcedureCatalog"
  ADD COLUMN "isMaternityDelivery" BOOLEAN NOT NULL DEFAULT false;

UPDATE "MaternityProfile"
SET "status" = 'DELIVERED'
WHERE EXISTS (
  SELECT 1
  FROM "DeliveryRecord"
  WHERE "DeliveryRecord"."maternityProfileId" = "MaternityProfile"."id"
);
