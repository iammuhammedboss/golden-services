/*
  Warnings:

  - The values [LIGHT,MEDIUM,HEAVY,SEVERE] on the enum `DirtLevel` will be removed. If these variants are still used in the database, this will fail.
  - The values [SCHEDULED] on the enum `SiteVisitStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `siteId` on the `job_orders` table. All the data in the column will be lost.
  - You are about to drop the column `siteId` on the `measurements` table. All the data in the column will be lost.
  - You are about to drop the column `siteId` on the `quotations` table. All the data in the column will be lost.
  - You are about to drop the column `siteId` on the `site_visits` table. All the data in the column will be lost.
  - You are about to drop the `sites` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SizeMeasurementMode" AS ENUM ('PRESET', 'DIMENSIONS');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO');

-- AlterEnum
BEGIN;
CREATE TYPE "DirtLevel_new" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5');
ALTER TABLE "measurement_objects" ALTER COLUMN "dirtLevel" TYPE "DirtLevel_new" USING ("dirtLevel"::text::"DirtLevel_new");
ALTER TYPE "DirtLevel" RENAME TO "DirtLevel_old";
ALTER TYPE "DirtLevel_new" RENAME TO "DirtLevel";
DROP TYPE "public"."DirtLevel_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MeasurementObjectType" ADD VALUE 'APARTMENT';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'SHOP';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'BEDROOM';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'BATHROOM';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'LIVING_ROOM';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'DINING_ROOM';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'CORRIDOR';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'TERRACE';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'GARAGE';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'STORAGE_ROOM';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'LAUNDRY_ROOM';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'SOFA';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'CHAIR';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'TABLE';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'BED';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'WARDROBE';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'CABINET';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'SHELF';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'DESK';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'DRESSER';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'DOOR';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'WINDOW';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'CURTAIN';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'BLIND';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'MIRROR';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'LIGHT_FIXTURE';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'AC_UNIT';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'REFRIGERATOR';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'WASHING_MACHINE';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'DISHWASHER';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'OVEN';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'MICROWAVE';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'TV';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'CARPET';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'RUG';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'MAT';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'TILE';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'WALLPAPER';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'GARDEN';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'POOL';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'PATIO';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'FENCE';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'GATE';
ALTER TYPE "MeasurementObjectType" ADD VALUE 'OTHER';

-- AlterEnum
BEGIN;
CREATE TYPE "SiteVisitStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."site_visits" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "site_visits" ALTER COLUMN "status" TYPE "SiteVisitStatus_new" USING ("status"::text::"SiteVisitStatus_new");
ALTER TYPE "SiteVisitStatus" RENAME TO "SiteVisitStatus_old";
ALTER TYPE "SiteVisitStatus_new" RENAME TO "SiteVisitStatus";
DROP TYPE "public"."SiteVisitStatus_old";
ALTER TABLE "site_visits" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "job_orders" DROP CONSTRAINT "job_orders_siteId_fkey";

-- DropForeignKey
ALTER TABLE "measurements" DROP CONSTRAINT "measurements_siteId_fkey";

-- DropForeignKey
ALTER TABLE "quotations" DROP CONSTRAINT "quotations_siteId_fkey";

-- DropForeignKey
ALTER TABLE "site_visits" DROP CONSTRAINT "site_visits_siteId_fkey";

-- DropForeignKey
ALTER TABLE "sites" DROP CONSTRAINT "sites_clientId_fkey";

-- DropIndex
DROP INDEX "measurements_siteId_idx";

-- DropIndex
DROP INDEX "site_visits_siteId_idx";

-- AlterTable
ALTER TABLE "item_masters" ADD COLUMN     "allowedChildTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "allowedParentTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "canBeRootLevel" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "job_orders" DROP COLUMN "siteId",
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "measurement_objects" ADD COLUMN     "dimensionHeight" DECIMAL(10,2),
ADD COLUMN     "dimensionLength" DECIMAL(10,2),
ADD COLUMN     "dimensionUnit" TEXT,
ADD COLUMN     "dimensionWidth" DECIMAL(10,2),
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "sizeMode" "SizeMeasurementMode";

-- AlterTable
ALTER TABLE "measurements" DROP COLUMN "siteId",
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "quotations" DROP COLUMN "siteId";

-- AlterTable
ALTER TABLE "site_visits" DROP COLUMN "siteId",
ADD COLUMN     "googleMapsUrl" TEXT,
ADD COLUMN     "locationText" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "siteContactName" TEXT,
ADD COLUMN     "siteContactPhone" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- DropTable
DROP TABLE "sites";

-- DropEnum
DROP TYPE "SiteType";

-- CreateTable
CREATE TABLE "measurement_stains" (
    "id" TEXT NOT NULL,
    "measurementObjectId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "measurement_stains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement_areas_of_notice" (
    "id" TEXT NOT NULL,
    "measurementObjectId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "measurement_areas_of_notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement_object_media" (
    "id" TEXT NOT NULL,
    "measurementObjectId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "duration" INTEGER,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "measurement_object_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "measurement_stains_measurementObjectId_idx" ON "measurement_stains"("measurementObjectId");

-- CreateIndex
CREATE INDEX "measurement_stains_deletedAt_idx" ON "measurement_stains"("deletedAt");

-- CreateIndex
CREATE INDEX "measurement_areas_of_notice_measurementObjectId_idx" ON "measurement_areas_of_notice"("measurementObjectId");

-- CreateIndex
CREATE INDEX "measurement_areas_of_notice_deletedAt_idx" ON "measurement_areas_of_notice"("deletedAt");

-- CreateIndex
CREATE INDEX "measurement_object_media_measurementObjectId_idx" ON "measurement_object_media"("measurementObjectId");

-- CreateIndex
CREATE INDEX "measurement_object_media_type_idx" ON "measurement_object_media"("type");

-- CreateIndex
CREATE INDEX "measurement_object_media_deletedAt_idx" ON "measurement_object_media"("deletedAt");

-- CreateIndex
CREATE INDEX "site_visits_status_idx" ON "site_visits"("status");

-- AddForeignKey
ALTER TABLE "measurement_stains" ADD CONSTRAINT "measurement_stains_measurementObjectId_fkey" FOREIGN KEY ("measurementObjectId") REFERENCES "measurement_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_areas_of_notice" ADD CONSTRAINT "measurement_areas_of_notice_measurementObjectId_fkey" FOREIGN KEY ("measurementObjectId") REFERENCES "measurement_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_object_media" ADD CONSTRAINT "measurement_object_media_measurementObjectId_fkey" FOREIGN KEY ("measurementObjectId") REFERENCES "measurement_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
