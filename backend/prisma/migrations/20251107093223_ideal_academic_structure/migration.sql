/*
  Warnings:

  - You are about to drop the column `assessor_id` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the column `module_id` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the `ModuleAssignment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[student_id,offeringId]` on the table `Enrollment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `offeringId` to the `Enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Enrollment" DROP CONSTRAINT "Enrollment_assessor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Enrollment" DROP CONSTRAINT "Enrollment_module_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ModuleAssignment" DROP CONSTRAINT "ModuleAssignment_assessorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ModuleAssignment" DROP CONSTRAINT "ModuleAssignment_moduleId_fkey";

-- DropIndex
DROP INDEX "public"."Enrollment_module_id_student_id_key";

-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "assessor_id",
DROP COLUMN "module_id",
ADD COLUMN     "offeringId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."ModuleAssignment";

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumModule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "yearOfStudy" INTEGER NOT NULL,
    "semesterOfStudy" INTEGER NOT NULL,

    CONSTRAINT "CurriculumModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offering" (
    "id" TEXT NOT NULL,
    "curriculumModuleId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,

    CONSTRAINT "Offering_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_name_key" ON "AcademicYear"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_academicYearId_name_key" ON "Semester"("academicYearId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumModule_courseId_moduleId_key" ON "CurriculumModule"("courseId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Offering_curriculumModuleId_semesterId_key" ON "Offering"("curriculumModuleId", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_student_id_offeringId_key" ON "Enrollment"("student_id", "offeringId");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumModule" ADD CONSTRAINT "CurriculumModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumModule" ADD CONSTRAINT "CurriculumModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("module_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offering" ADD CONSTRAINT "Offering_curriculumModuleId_fkey" FOREIGN KEY ("curriculumModuleId") REFERENCES "CurriculumModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offering" ADD CONSTRAINT "Offering_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offering" ADD CONSTRAINT "Offering_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "Assessor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
