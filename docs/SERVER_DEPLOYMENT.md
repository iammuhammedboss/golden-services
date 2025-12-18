# Server Deployment Guide

## Quick Fix for Enum Migration Error

If you're seeing this error after pulling the latest changes:

```
ERROR: invalid input value for enum "SiteVisitStatus_new": "SCHEDULED"
```

### Solution 1: Automated Script (Recommended)

**Linux/Mac:**
```bash
chmod +x scripts/migrate-enums.sh
./scripts/migrate-enums.sh
```

**Windows:**
```cmd
scripts\migrate-enums.bat
```

### Solution 2: Manual Steps

**Step 1: Update existing data**
```bash
# Connect to your database and run the migration SQL
psql "$DATABASE_URL" -f prisma/migrations/pre-migration-enum-update.sql
```

**Step 2: Apply schema changes**
```bash
npx prisma db push
```

### Solution 3: One-liner (if you have psql)

```bash
psql "$DATABASE_URL" -f prisma/migrations/pre-migration-enum-update.sql && npx prisma db push
```

### Solution 4: Using database GUI (TablePlus, pgAdmin, etc.)

1. Open `prisma/migrations/pre-migration-enum-update.sql`
2. Copy the SQL commands
3. Execute them in your database GUI
4. Run `npx prisma db push`

## What Gets Updated

- `SiteVisitStatus`: `SCHEDULED` → `PENDING`
- `DirtLevel`:
  - `LIGHT` → `LEVEL_2`
  - `MEDIUM` → `LEVEL_3`
  - `HEAVY` → `LEVEL_4`
  - `SEVERE` → `LEVEL_5`

## After Migration

Once the migration is complete, regenerate Prisma Client:

```bash
npx prisma generate
```

Then restart your application:

```bash
# If using PM2
pm2 restart all

# If using npm
npm run build
npm start
```

## Troubleshooting

### "psql: command not found"

Install PostgreSQL client tools or use your database GUI to run the SQL script.

### Permission denied on scripts

```bash
chmod +x scripts/migrate-enums.sh
```

### DATABASE_URL not found

Make sure your `.env` file is properly configured:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/golden_services"
```

## Need Help?

See the full [Migration Guide](./MIGRATION_GUIDE.md) for detailed information.
