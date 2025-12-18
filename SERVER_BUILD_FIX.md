# Server Build Fix - Missing Dependencies

## Issue
`npm install` is removing packages instead of installing them, causing the build to fail with missing `tailwindcss`.

## Fix - Run These Commands:

```bash
cd /var/apps/golden-services

# Remove corrupted node_modules and lock file
rm -rf node_modules package-lock.json

# Clean npm cache
npm cache clean --force

# Reinstall all dependencies
npm install

# Run the enum migration
set -a && source .env && set +a
PSQL_URL=$(echo "$DATABASE_URL" | sed 's/?schema=public//' | sed 's/?.*$//')
psql "$PSQL_URL" -f prisma/migrations/simple-enum-fix.sql

# Push Prisma schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Build the application
npm run build

# Restart PM2
pm2 restart golden-services

# Check status
pm2 status
pm2 logs golden-services --lines 50
```

## Alternative: If Still Failing

If the above doesn't work, pull package-lock.json from GitHub:

```bash
cd /var/apps/golden-services

# Stash any local changes
git stash

# Pull latest including package-lock.json
git pull origin main

# Remove node_modules
rm -rf node_modules

# Fresh install
npm ci  # This uses package-lock.json exactly

# Continue with migration and build
set -a && source .env && set +a
PSQL_URL=$(echo "$DATABASE_URL" | sed 's/?schema=public//' | sed 's/?.*$//')
psql "$PSQL_URL" -f prisma/migrations/simple-enum-fix.sql
npx prisma db push
npx prisma generate
npm run build
pm2 restart golden-services
```

## What Went Wrong

The server had a corrupted or outdated `package-lock.json` that caused npm to think packages should be removed. Starting fresh fixes this.
