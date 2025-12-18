# Database Migration Guide

## Issue: Enum Value Changes

When pulling the latest changes, you may encounter an error about enum values being removed. This is because the schema has updated enum values but the database still contains the old values.

### Error Message
```
ERROR: invalid input value for enum "SiteVisitStatus_new": "SCHEDULED"
```

## Solution

### Step 1: Connect to your database

```bash
# Using psql
psql -h localhost -U your_username -d golden_services

# Or if using a connection string
psql postgresql://username:password@localhost:5432/golden_services
```

### Step 2: Run the pre-migration SQL script

```bash
# From the project root, run:
psql -h localhost -U your_username -d golden_services -f prisma/migrations/pre-migration-enum-update.sql
```

Or copy and paste the SQL commands from `prisma/migrations/pre-migration-enum-update.sql` into your database client.

### Step 3: Apply the Prisma schema changes

```bash
npx prisma db push
```

## What Changed

### SiteVisitStatus Enum
- **Removed:** `SCHEDULED`
- **Added:** `PENDING`, `IN_PROGRESS`
- **Migration:** All `SCHEDULED` values are converted to `PENDING`

### DirtLevel Enum
- **Removed:** `LIGHT`, `MEDIUM`, `HEAVY`, `SEVERE`
- **New Values:** `LEVEL_1`, `LEVEL_2`, `LEVEL_3`, `LEVEL_4`, `LEVEL_5`
- **Migration:**
  - `LIGHT` → `LEVEL_2`
  - `MEDIUM` → `LEVEL_3`
  - `HEAVY` → `LEVEL_4`
  - `SEVERE` → `LEVEL_5`

## Verification

After running the migration, verify the changes:

```sql
-- Check site visit statuses
SELECT status, COUNT(*) FROM site_visits GROUP BY status;

-- Check dirt levels
SELECT "dirtLevel", COUNT(*) FROM measurement_objects WHERE "dirtLevel" IS NOT NULL GROUP BY "dirtLevel";
```

## Rollback (if needed)

If you need to rollback:

```sql
-- Rollback SiteVisitStatus
UPDATE site_visits SET status = 'SCHEDULED' WHERE status = 'PENDING';

-- Rollback DirtLevel
UPDATE measurement_objects SET "dirtLevel" = 'LIGHT' WHERE "dirtLevel" = 'LEVEL_2';
UPDATE measurement_objects SET "dirtLevel" = 'MEDIUM' WHERE "dirtLevel" = 'LEVEL_3';
UPDATE measurement_objects SET "dirtLevel" = 'HEAVY' WHERE "dirtLevel" = 'LEVEL_4';
UPDATE measurement_objects SET "dirtLevel" = 'SEVERE' WHERE "dirtLevel" = 'LEVEL_5';
```

## Alternative: Fresh Database

If this is a development environment and you don't need to preserve data:

```bash
# Reset the database (WARNING: This will delete all data!)
npx prisma db push --force-reset

# Re-seed the database
npx tsx prisma/seed-measurement-catalog.ts
```
