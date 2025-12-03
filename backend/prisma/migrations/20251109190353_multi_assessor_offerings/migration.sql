/*
  Warnings:

  - You are about to drop the column `assessorId` on the `Offering` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[moduleId,semesterId]` on the table `Offering` will be added. If there are existing duplicate values, this will fail.
  - Made the column `moduleId` on table `Offering` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Offering" DROP CONSTRAINT "Offering_assessorId_fkey";

-- AlterTable
ALTER TABLE "Offering" DROP COLUMN "assessorId",
ALTER COLUMN "moduleId" SET NOT NULL;

-- CreateTable
CREATE TABLE "OfferingAssignment" (
    "offeringId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferingAssignment_pkey" PRIMARY KEY ("offeringId","assessorId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Offering_moduleId_semesterId_key" ON "Offering"("moduleId", "semesterId");

-- AddForeignKey
ALTER TABLE "OfferingAssignment" ADD CONSTRAINT "OfferingAssignment_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingAssignment" ADD CONSTRAINT "OfferingAssignment_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "Assessor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
