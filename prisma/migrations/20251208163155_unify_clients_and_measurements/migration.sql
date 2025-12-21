/*
  Warnings:

  - The values [COMPANY] on the enum `ClientType` will be removed. If these variants are still used in the database, this will fail.
  - The values [NOT_STARTED,ON_HOLD,COMPLETED] on the enum `JobProgressStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `roomItemId` on the `checklist_items` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `photos` table. All the data in the column will be lost.
  - You are about to drop the column `leadId` on the `schedule_entries` table. All the data in the column will be lost.
  - You are about to drop the `measurement_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `room_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rooms` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `source` on the `leads` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `clientId` on table `schedule_entries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `clientId` on table `site_visits` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SiteType" AS ENUM ('HOUSE', 'FLAT', 'VILLA', 'OFFICE', 'WAREHOUSE', 'SHOP', 'OTHER_RESIDENTIAL', 'OTHER_COMMERCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "MeasurementStatus" AS ENUM ('DRAFT', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MeasurementObjectType" AS ENUM ('HOUSE', 'VILLA', 'FLAT', 'OFFICE', 'WAREHOUSE', 'ROOM', 'KITCHEN', 'TOILET', 'HALL', 'PASSAGE', 'BALCONY', 'STAIRCASE', 'ITEM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ObjectSize" AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('SOFA', 'CARPET', 'CURTAINS', 'TANK', 'TV', 'TABLE', 'CHAIR', 'MAT', 'DOOR', 'HANDLE', 'WINDOW', 'INTERLOCK', 'OTHER');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('NEW', 'ACTIVE', 'INACTIVE', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "ClientSource" AS ENUM ('PHONE', 'WHATSAPP', 'SOCIAL_MEDIA', 'SITE_VISIT_MARKETING', 'WEBSITE_FORM', 'REFERRAL', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "ClientType_new" AS ENUM ('INDIVIDUAL', 'CORPORATE');
ALTER TABLE "public"."clients" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "clients" ALTER COLUMN "type" TYPE "ClientType_new" USING ("type"::text::"ClientType_new");
ALTER TYPE "ClientType" RENAME TO "ClientType_old";
ALTER TYPE "ClientType_new" RENAME TO "ClientType";
DROP TYPE "public"."ClientType_old";
ALTER TABLE "clients" ALTER COLUMN "type" SET DEFAULT 'INDIVIDUAL';
COMMIT;

-- AlterEnum
ALTER TYPE "DirtLevel" ADD VALUE 'SEVERE';

-- AlterEnum
BEGIN;
CREATE TYPE "JobProgressStatus_new" AS ENUM ('AT_STORE', 'MATERIALS_TAKEN', 'DEPARTED_TO_SITE', 'ARRIVED_AT_SITE', 'IN_PROGRESS', 'COMPLETION_REQUESTED', 'VERIFIED', 'DEPARTED_SITE', 'ARRIVED_OFFICE', 'CANCELLED');
ALTER TABLE "job_status_updates" ALTER COLUMN "status" TYPE "JobProgressStatus_new" USING ("status"::text::"JobProgressStatus_new");
ALTER TYPE "JobProgressStatus" RENAME TO "JobProgressStatus_old";
ALTER TYPE "JobProgressStatus_new" RENAME TO "JobProgressStatus";
DROP TYPE "public"."JobProgressStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "checklist_items" DROP CONSTRAINT "checklist_items_roomItemId_fkey";

-- DropForeignKey
ALTER TABLE "measurement_items" DROP CONSTRAINT "measurement_items_siteVisitId_fkey";

-- DropForeignKey
ALTER TABLE "photos" DROP CONSTRAINT "photos_roomId_fkey";

-- DropForeignKey
ALTER TABLE "room_items" DROP CONSTRAINT "room_items_itemMasterId_fkey";

-- DropForeignKey
ALTER TABLE "room_items" DROP CONSTRAINT "room_items_roomId_fkey";

-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_siteId_fkey";

-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_siteVisitId_fkey";

-- DropForeignKey
ALTER TABLE "schedule_entries" DROP CONSTRAINT "schedule_entries_clientId_fkey";

-- DropForeignKey
ALTER TABLE "schedule_entries" DROP CONSTRAINT "schedule_entries_leadId_fkey";

-- DropForeignKey
ALTER TABLE "site_visits" DROP CONSTRAINT "site_visits_clientId_fkey";

-- DropIndex
DROP INDEX "photos_roomId_idx";

-- DropIndex
DROP INDEX "site_visits_leadId_idx";

-- AlterTable
ALTER TABLE "checklist_items" DROP COLUMN "roomItemId",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "source" "ClientSource" NOT NULL DEFAULT 'PHONE',
ADD COLUMN     "status" "ClientStatus" NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "item_masters" ADD COLUMN     "itemType" "ItemType" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "job_orders" ADD COLUMN     "measurementId" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE "leads" DROP COLUMN "source",
ADD COLUMN     "source" "ClientSource" NOT NULL;

-- AlterTable
ALTER TABLE "photos" DROP COLUMN "roomId",
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "measurementId" TEXT,
ADD COLUMN     "measurementObjectId" TEXT;

-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "bankDetailsSnapshot" TEXT,
ADD COLUMN     "bankDetailsTemplateId" TEXT,
ADD COLUMN     "discountType" "DiscountType",
ADD COLUMN     "discountValue" DECIMAL(10,3),
ADD COLUMN     "measurementId" TEXT,
ADD COLUMN     "termsSnapshot" TEXT,
ADD COLUMN     "termsTemplateId" TEXT,
ADD COLUMN     "vatEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vatPercentage" DECIMAL(5,2) NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "schedule_entries" DROP COLUMN "leadId",
ALTER COLUMN "clientId" SET NOT NULL;

-- AlterTable
ALTER TABLE "site_visits" ADD COLUMN     "requiredService" TEXT,
ALTER COLUMN "clientId" SET NOT NULL;

-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "bhkType" TEXT,
ADD COLUMN     "flatType" TEXT,
ADD COLUMN     "houseType" TEXT,
ADD COLUMN     "personInCharge" TEXT,
ADD COLUMN     "personPhone" TEXT,
ADD COLUMN     "type" "SiteType" NOT NULL DEFAULT 'HOUSE';

-- DropTable
DROP TABLE "measurement_items";

-- DropTable
DROP TABLE "room_items";

-- DropTable
DROP TABLE "rooms";

-- DropEnum
DROP TYPE "LeadSource";

-- CreateTable
CREATE TABLE "measurements" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "siteId" TEXT,
    "siteVisitId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "status" "MeasurementStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement_objects" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "parentObjectId" TEXT,
    "type" "MeasurementObjectType" NOT NULL,
    "name" TEXT NOT NULL,
    "itemMasterId" TEXT,
    "size" "ObjectSize",
    "dirtLevel" "DirtLevel",
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "measurement_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "recipientRole" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "terms_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_details_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "bank_details_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "measurements_clientId_idx" ON "measurements"("clientId");

-- CreateIndex
CREATE INDEX "measurements_siteId_idx" ON "measurements"("siteId");

-- CreateIndex
CREATE INDEX "measurements_siteVisitId_idx" ON "measurements"("siteVisitId");

-- CreateIndex
CREATE INDEX "measurements_deletedAt_idx" ON "measurements"("deletedAt");

-- CreateIndex
CREATE INDEX "measurement_objects_measurementId_idx" ON "measurement_objects"("measurementId");

-- CreateIndex
CREATE INDEX "measurement_objects_parentObjectId_idx" ON "measurement_objects"("parentObjectId");

-- CreateIndex
CREATE INDEX "measurement_objects_type_idx" ON "measurement_objects"("type");

-- CreateIndex
CREATE INDEX "measurement_objects_deletedAt_idx" ON "measurement_objects"("deletedAt");

-- CreateIndex
CREATE INDEX "notifications_recipientUserId_idx" ON "notifications"("recipientUserId");

-- CreateIndex
CREATE INDEX "notifications_recipientRole_idx" ON "notifications"("recipientRole");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "terms_templates_name_key" ON "terms_templates"("name");

-- CreateIndex
CREATE INDEX "terms_templates_deletedAt_idx" ON "terms_templates"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "bank_details_templates_name_key" ON "bank_details_templates"("name");

-- CreateIndex
CREATE INDEX "bank_details_templates_deletedAt_idx" ON "bank_details_templates"("deletedAt");

-- CreateIndex
CREATE INDEX "checklist_items_isVerified_idx" ON "checklist_items"("isVerified");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_source_idx" ON "clients"("source");

-- CreateIndex
CREATE INDEX "job_orders_paymentStatus_idx" ON "job_orders"("paymentStatus");

-- CreateIndex
CREATE INDEX "job_orders_measurementId_idx" ON "job_orders"("measurementId");

-- CreateIndex
CREATE INDEX "photos_measurementId_idx" ON "photos"("measurementId");

-- CreateIndex
CREATE INDEX "photos_measurementObjectId_idx" ON "photos"("measurementObjectId");

-- CreateIndex
CREATE INDEX "quotations_measurementId_idx" ON "quotations"("measurementId");

-- CreateIndex
CREATE INDEX "schedule_entries_clientId_idx" ON "schedule_entries"("clientId");

-- CreateIndex
CREATE INDEX "sites_type_idx" ON "sites"("type");

-- AddForeignKey
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_siteVisitId_fkey" FOREIGN KEY ("siteVisitId") REFERENCES "site_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_objects" ADD CONSTRAINT "measurement_objects_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "measurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_objects" ADD CONSTRAINT "measurement_objects_parentObjectId_fkey" FOREIGN KEY ("parentObjectId") REFERENCES "measurement_objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_objects" ADD CONSTRAINT "measurement_objects_itemMasterId_fkey" FOREIGN KEY ("itemMasterId") REFERENCES "item_masters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "measurements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_measurementObjectId_fkey" FOREIGN KEY ("measurementObjectId") REFERENCES "measurement_objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "measurements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_termsTemplateId_fkey" FOREIGN KEY ("termsTemplateId") REFERENCES "terms_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_bankDetailsTemplateId_fkey" FOREIGN KEY ("bankDetailsTemplateId") REFERENCES "bank_details_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "measurements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
