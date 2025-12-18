# Server Fix Commands - Copy and Paste

Run these commands on your server **in order**:

## Step 1: Navigate to project directory
```bash
cd /var/apps/golden-services
```

## Step 2: Stash local changes and pull
```bash
git stash
git pull
```

## Step 3: Run the migration script
```bash
chmod +x scripts/migrate-enums.sh
./scripts/migrate-enums.sh
```

## Step 4: Restart your application
```bash
# If using PM2
pm2 restart all

# If using npm directly
npm run build
npm start

# If using systemd
sudo systemctl restart golden-services
```

## Alternative: If stash doesn't work

If the stash command fails, force discard local changes:

```bash
cd /var/apps/golden-services
git reset --hard HEAD
git pull
chmod +x scripts/migrate-enums.sh
./scripts/migrate-enums.sh
pm2 restart all
```

## Verify Migration Success

After running the migration, check:

```bash
# Check if the app is running
pm2 status

# Check logs
pm2 logs golden-services --lines 50
```

## If You Still Get Errors

Run the SQL manually:

```bash
# Connect to database
psql postgresql://postgres:Admin123@localhost:5432/golden_services

# Run these SQL commands:
UPDATE "site_visits" SET status = 'PENDING' WHERE status = 'SCHEDULED';
UPDATE "measurement_objects" SET "dirtLevel" = 'LEVEL_2' WHERE "dirtLevel" = 'LIGHT';
UPDATE "measurement_objects" SET "dirtLevel" = 'LEVEL_3' WHERE "dirtLevel" = 'MEDIUM';
UPDATE "measurement_objects" SET "dirtLevel" = 'LEVEL_4' WHERE "dirtLevel" = 'HEAVY';
UPDATE "measurement_objects" SET "dirtLevel" = 'LEVEL_5' WHERE "dirtLevel" = 'SEVERE';

# Exit
\q

# Then apply Prisma changes
npx prisma db push
npx prisma generate
pm2 restart all
```
