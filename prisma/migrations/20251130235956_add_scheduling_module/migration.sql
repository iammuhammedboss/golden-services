-- CreateEnum
CREATE TYPE "ScheduleEntryType" AS ENUM ('JOB_EXECUTION', 'MEASUREMENT_VISIT', 'FOLLOW_UP', 'PAYMENT_COLLECTION', 'INTERNAL_TASK');

-- CreateEnum
CREATE TYPE "ScheduleEntryStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "schedule_entries" (
    "id" TEXT NOT NULL,
    "jobOrderId" TEXT,
    "siteVisitId" TEXT,
    "leadId" TEXT,
    "clientId" TEXT,
    "type" "ScheduleEntryType" NOT NULL,
    "status" "ScheduleEntryStatus" NOT NULL DEFAULT 'PLANNED',
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "locationText" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "schedule_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_entry_assignees" (
    "id" TEXT NOT NULL,
    "scheduleEntryId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "roleInVisit" TEXT NOT NULL,

    CONSTRAINT "schedule_entry_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_reminders" (
    "id" TEXT NOT NULL,
    "scheduleEntryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offsetMinutes" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "schedule_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_entries_jobOrderId_idx" ON "schedule_entries"("jobOrderId");

-- CreateIndex
CREATE INDEX "schedule_entries_siteVisitId_idx" ON "schedule_entries"("siteVisitId");

-- CreateIndex
CREATE INDEX "schedule_entries_startDateTime_endDateTime_idx" ON "schedule_entries"("startDateTime", "endDateTime");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_entry_assignees_scheduleEntryId_employeeId_key" ON "schedule_entry_assignees"("scheduleEntryId", "employeeId");

-- AddForeignKey
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_jobOrderId_fkey" FOREIGN KEY ("jobOrderId") REFERENCES "job_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_siteVisitId_fkey" FOREIGN KEY ("siteVisitId") REFERENCES "site_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_entry_assignees" ADD CONSTRAINT "schedule_entry_assignees_scheduleEntryId_fkey" FOREIGN KEY ("scheduleEntryId") REFERENCES "schedule_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_entry_assignees" ADD CONSTRAINT "schedule_entry_assignees_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_reminders" ADD CONSTRAINT "schedule_reminders_scheduleEntryId_fkey" FOREIGN KEY ("scheduleEntryId") REFERENCES "schedule_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_reminders" ADD CONSTRAINT "schedule_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
