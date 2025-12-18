# 🚨 QUICK FIX FOR SERVER ENUM ERROR

## Error You're Seeing:
```
ERROR: invalid input value for enum "SiteVisitStatus_new": "SCHEDULED"
```

## Quick Solution (Choose ONE):

### Option 1: One Command (FASTEST) ⚡

```bash
git pull

# Load .env and run migration (removes Prisma query params for psql)
set -a && source .env && set +a && \
PSQL_URL=$(echo "$DATABASE_URL" | sed 's/?schema=public//' | sed 's/?.*$//') && \
psql "$PSQL_URL" -f prisma/migrations/pre-migration-enum-update.sql && \
npx prisma db push
```

### Option 2: Automated Script

**Linux/Mac:**
```bash
git pull
chmod +x scripts/migrate-enums.sh
./scripts/migrate-enums.sh
```

**Windows:**
```bash
git pull
scripts\migrate-enums.bat
```

### Option 3: Step-by-Step Manual

```bash
git pull

# Load environment variables
set -a
source .env
set +a

# Remove Prisma query params from DATABASE_URL for psql
PSQL_URL=$(echo "$DATABASE_URL" | sed 's/?schema=public//' | sed 's/?.*$//')

# Run the SQL migration
psql "$PSQL_URL" -f prisma/migrations/pre-migration-enum-update.sql

# Apply Prisma schema
npx prisma db push

# Regenerate Prisma client
npx prisma generate
```

### Option 4: Using Database GUI (TablePlus, pgAdmin, etc.)

1. Pull the latest code: `git pull`
2. Open file: `prisma/migrations/pre-migration-enum-update.sql`
3. Copy all SQL commands
4. Execute in your database GUI
5. Run: `npx prisma db push`
6. Run: `npx prisma generate`

### Option 5: Direct psql Connection

```bash
git pull

# Connect to database (remove ?schema=public from your DATABASE_URL)
# Example: postgresql://postgres:Admin123@localhost:5432/golden_services
psql postgresql://postgres:Admin123@localhost:5432/golden_services

# Then paste these commands:
UPDATE "site_visits" SET status = 'PENDING' WHERE status = 'SCHEDULED';
UPDATE "measurement_objects" SET "dirtLevel" = 'LEVEL_2' WHERE "dirtLevel" = 'LIGHT';
UPDATE "measurement_objects" SET "dirtLevel" = 'LEVEL_3' WHERE "dirtLevel" = 'MEDIUM';
UPDATE "measurement_objects" SET "dirtLevel" = 'LEVEL_4' WHERE "dirtLevel" = 'HEAVY';
UPDATE "measurement_objects" SET "dirtLevel" = 'LEVEL_5' WHERE "dirtLevel" = 'SEVERE';
\q

# Then run:
npx prisma db push
npx prisma generate
```

## After Migration

Restart your application:

```bash
# Using PM2
pm2 restart all

# Using npm
npm run build
npm start

# Using systemd
sudo systemctl restart your-app-name
```

## What Changed?

- **SiteVisitStatus**: `SCHEDULED` is now `PENDING`
- **DirtLevel**: Changed from `LIGHT/MEDIUM/HEAVY/SEVERE` to `LEVEL_1` through `LEVEL_5`

## Still Having Issues?

See the full guides:
- [Migration Guide](docs/MIGRATION_GUIDE.md)
- [Server Deployment Guide](docs/SERVER_DEPLOYMENT.md)

Or check that your DATABASE_URL is correct in `.env` file.
