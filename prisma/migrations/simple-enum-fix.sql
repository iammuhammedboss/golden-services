-- Simple enum migration for PostgreSQL
-- This adds new enum values if they don't exist, then updates data

-- Add PENDING to SiteVisitStatus
DO $$
BEGIN
    BEGIN
        ALTER TYPE "SiteVisitStatus" ADD VALUE 'PENDING';
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Value already exists, ignore
    END;
END $$;

-- Add IN_PROGRESS to SiteVisitStatus
DO $$
BEGIN
    BEGIN
        ALTER TYPE "SiteVisitStatus" ADD VALUE 'IN_PROGRESS';
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Add LEVEL_1 to DirtLevel
DO $$
BEGIN
    BEGIN
        ALTER TYPE "DirtLevel" ADD VALUE 'LEVEL_1';
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Add LEVEL_2 to DirtLevel
DO $$
BEGIN
    BEGIN
        ALTER TYPE "DirtLevel" ADD VALUE 'LEVEL_2';
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Add LEVEL_3 to DirtLevel
DO $$
BEGIN
    BEGIN
        ALTER TYPE "DirtLevel" ADD VALUE 'LEVEL_3';
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Add LEVEL_4 to DirtLevel
DO $$
BEGIN
    BEGIN
        ALTER TYPE "DirtLevel" ADD VALUE 'LEVEL_4';
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Add LEVEL_5 to DirtLevel
DO $$
BEGIN
    BEGIN
        ALTER TYPE "DirtLevel" ADD VALUE 'LEVEL_5';
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Now update the data (these will only succeed after values are added above)
UPDATE "site_visits" SET status = 'PENDING' WHERE status = 'SCHEDULED';
UPDATE "measurement_objects" SET "dirtLevel" = 'LEVEL_2' WHERE "dirtLevel" = 'LIGHT';
UPDATE "measurement_objects" SET "dirtLevel" = 'LEVEL_3' WHERE "dirtLevel" = 'MEDIUM';
UPDATE "measurement_objects" SET "dirtLevel" = 'LEVEL_4' WHERE "dirtLevel" = 'HEAVY';
UPDATE "measurement_objects" SET "dirtLevel" = 'LEVEL_5' WHERE "dirtLevel" = 'SEVERE';

-- Show results
SELECT 'Migration complete. Current status values:' as message;
SELECT status, COUNT(*) FROM "site_visits" GROUP BY status ORDER BY status;
