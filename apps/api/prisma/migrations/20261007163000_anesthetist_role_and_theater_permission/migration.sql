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
