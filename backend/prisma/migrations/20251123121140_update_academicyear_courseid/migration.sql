/*
  Warnings:

  - A unique constraint covering the columns `[name,courseId]` on the table `AcademicYear` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `courseId` to the `AcademicYear` table without a default value. This is not possible if the table is not empty.
  - Made the column `semesterOfStudy` on table `Module` required. This step will fail if there are existing NULL values in that column.
  - Made the column `yearOfStudy` on table `Module` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."AcademicYear_name_key";

-- AlterTable
ALTER TABLE "AcademicYear" ADD COLUMN     "courseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Module" ALTER COLUMN "semesterOfStudy" SET NOT NULL,
ALTER COLUMN "yearOfStudy" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_name_courseId_key" ON "AcademicYear"("name", "courseId");

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;
