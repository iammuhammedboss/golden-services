-- Step 1: Add NEW enum values to existing enums (if they don't exist)
-- This allows us to update data to use the new values

-- Add PENDING and IN_PROGRESS to SiteVisitStatus if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PENDING' AND enumtypid = 'SiteVisitStatus'::regtype) THEN
        ALTER TYPE "SiteVisitStatus" ADD VALUE 'PENDING';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'IN_PROGRESS' AND enumtypid = 'SiteVisitStatus'::regtype) THEN
        ALTER TYPE "SiteVisitStatus" ADD VALUE 'IN_PROGRESS';
    END IF;
END $$;

-- Add LEVEL_1 through LEVEL_5 to DirtLevel if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LEVEL_1' AND enumtypid = 'DirtLevel'::regtype) THEN
        ALTER TYPE "DirtLevel" ADD VALUE 'LEVEL_1';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LEVEL_2' AND enumtypid = 'DirtLevel'::regtype) THEN
        ALTER TYPE "DirtLevel" ADD VALUE 'LEVEL_2';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LEVEL_3' AND enumtypid = 'DirtLevel'::regtype) THEN
        ALTER TYPE "DirtLevel" ADD VALUE 'LEVEL_3';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LEVEL_4' AND enumtypid = 'DirtLevel'::regtype) THEN
        ALTER TYPE "DirtLevel" ADD VALUE 'LEVEL_4';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LEVEL_5' AND enumtypid = 'DirtLevel'::regtype) THEN
        ALTER TYPE "DirtLevel" ADD VALUE 'LEVEL_5';
    END IF;
END $$;

-- Step 2: Now update the data to use new values
-- Update SiteVisitStatus: SCHEDULED -> PENDING
UPDATE "site_visits"
SET status = 'PENDING'
WHERE status = 'SCHEDULED';

-- Update DirtLevel: old values -> new values
-- Only update if old values exist
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

-- Step 3: Verify the changes
SELECT 'Site Visit Statuses:' as info;
SELECT status, COUNT(*) FROM "site_visits" GROUP BY status;

SELECT 'Dirt Levels:' as info;
SELECT "dirtLevel", COUNT(*) FROM "measurement_objects" WHERE "dirtLevel" IS NOT NULL GROUP BY "dirtLevel";

-- Note: Old enum values (SCHEDULED, LIGHT, MEDIUM, HEAVY, SEVERE) will be removed by Prisma db push
