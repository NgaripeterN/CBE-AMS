/*
  Warnings:

  - You are about to drop the column `student_id` on the `Observation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Observation" DROP CONSTRAINT "Observation_student_id_fkey";

-- AlterTable
ALTER TABLE "Observation" DROP COLUMN "student_id";

-- CreateTable
CREATE TABLE "StudentsOnObservations" (
    "studentId" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "StudentsOnObservations_pkey" PRIMARY KEY ("studentId","observationId")
);

-- AddForeignKey
ALTER TABLE "StudentsOnObservations" ADD CONSTRAINT "StudentsOnObservations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentsOnObservations" ADD CONSTRAINT "StudentsOnObservations_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
