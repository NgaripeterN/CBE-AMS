/*
  Warnings:

  - You are about to drop the column `createdById` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAssessorId` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the column `offeringId` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the column `semesterOfStudy` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `yearOfStudy` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `maxScore` on the `Observation` table. All the data in the column will be lost.
  - You are about to drop the `AcademicYear` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Offering` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferingAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Semester` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[module_id,student_id]` on the table `Enrollment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assessor_id` to the `Enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `module_id` to the `Enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."AcademicYear" DROP CONSTRAINT "AcademicYear_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Assessment" DROP CONSTRAINT "Assessment_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Enrollment" DROP CONSTRAINT "Enrollment_assignedAssessorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Enrollment" DROP CONSTRAINT "Enrollment_offeringId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Offering" DROP CONSTRAINT "Offering_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Offering" DROP CONSTRAINT "Offering_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferingAssignment" DROP CONSTRAINT "OfferingAssignment_assessorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferingAssignment" DROP CONSTRAINT "OfferingAssignment_offeringId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Semester" DROP CONSTRAINT "Semester_academicYearId_fkey";

-- DropIndex
DROP INDEX "public"."Enrollment_student_id_offeringId_key";

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "createdById",
DROP COLUMN "duration";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "minDescriptor" TEXT,
ADD COLUMN     "weighting" JSONB;

-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "assignedAssessorId",
DROP COLUMN "offeringId",
ADD COLUMN     "assessor_id" TEXT NOT NULL,
ADD COLUMN     "module_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Module" DROP COLUMN "semesterOfStudy",
DROP COLUMN "yearOfStudy";

-- AlterTable
ALTER TABLE "Observation" DROP COLUMN "maxScore",
ADD COLUMN     "group" "AssessmentGroup" NOT NULL DEFAULT 'FORMATIVE';

-- DropTable
DROP TABLE "public"."AcademicYear";

-- DropTable
DROP TABLE "public"."Notification";

-- DropTable
DROP TABLE "public"."Offering";

-- DropTable
DROP TABLE "public"."OfferingAssignment";

-- DropTable
DROP TABLE "public"."Semester";

-- CreateTable
CREATE TABLE "Competency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCompetencyEvidence" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "observationId" TEXT,
    "status" TEXT NOT NULL,
    "demonstratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentCompetencyEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleAssignment" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "role" "ModuleRole" NOT NULL DEFAULT 'GRADER',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ModuleCompetencies" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ModuleCompetencies_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Competency_name_key" ON "Competency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCompetencyEvidence_studentId_competencyId_assessment_key" ON "StudentCompetencyEvidence"("studentId", "competencyId", "assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCompetencyEvidence_studentId_competencyId_observatio_key" ON "StudentCompetencyEvidence"("studentId", "competencyId", "observationId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleAssignment_moduleId_assessorId_key" ON "ModuleAssignment"("moduleId", "assessorId");

-- CreateIndex
CREATE INDEX "_ModuleCompetencies_B_index" ON "_ModuleCompetencies"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_module_id_student_id_key" ON "Enrollment"("module_id", "student_id");

-- AddForeignKey
ALTER TABLE "StudentCompetencyEvidence" ADD CONSTRAINT "StudentCompetencyEvidence_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCompetencyEvidence" ADD CONSTRAINT "StudentCompetencyEvidence_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCompetencyEvidence" ADD CONSTRAINT "StudentCompetencyEvidence_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("module_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCompetencyEvidence" ADD CONSTRAINT "StudentCompetencyEvidence_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("assessment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCompetencyEvidence" ADD CONSTRAINT "StudentCompetencyEvidence_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleAssignment" ADD CONSTRAINT "ModuleAssignment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("module_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleAssignment" ADD CONSTRAINT "ModuleAssignment_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "Assessor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "Module"("module_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_assessor_id_fkey" FOREIGN KEY ("assessor_id") REFERENCES "Assessor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModuleCompetencies" ADD CONSTRAINT "_ModuleCompetencies_A_fkey" FOREIGN KEY ("A") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModuleCompetencies" ADD CONSTRAINT "_ModuleCompetencies_B_fkey" FOREIGN KEY ("B") REFERENCES "Module"("module_id") ON DELETE CASCADE ON UPDATE CASCADE;
