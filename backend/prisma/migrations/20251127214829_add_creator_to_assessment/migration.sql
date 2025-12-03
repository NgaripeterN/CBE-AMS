/*
  Warnings:

  - Added the required column `createdByAssessorId` to the `Assessment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "createdByAssessorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_createdByAssessorId_fkey" FOREIGN KEY ("createdByAssessorId") REFERENCES "Assessor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
