-- Pre-migration script to update enum values before schema change
-- Run this BEFORE running `npx prisma db push`

-- Update SiteVisitStatus: SCHEDULED -> PENDING
UPDATE "site_visits"
SET status = 'PENDING'
WHERE status = 'SCHEDULED';

-- Update DirtLevel if old values exist
-- Map old values to new values:
-- LIGHT -> LEVEL_2
-- MEDIUM -> LEVEL_3
-- HEAVY -> LEVEL_4
-- SEVERE -> LEVEL_5

UPDATE "measurement_objects"
SET "dirtLevel" = 'LEVEL_2'
WHERE "dirtLevel" = 'LIGHT';

UPDATE "measurement_objects"
SET "dirtLevel" = 'LEVEL_3'
WHERE "dirtLevel" = 'MEDIUM';

UPDATE "measurement_objects"
SET "dirtLevel" = 'LEVEL_4'
WHERE "dirtLevel" = 'HEAVY';

UPDATE "measurement_objects"
SET "dirtLevel" = 'LEVEL_5'
WHERE "dirtLevel" = 'SEVERE';

-- Verify the changes
SELECT status, COUNT(*) FROM "site_visits" GROUP BY status;
SELECT "dirtLevel", COUNT(*) FROM "measurement_objects" WHERE "dirtLevel" IS NOT NULL GROUP BY "dirtLevel";
