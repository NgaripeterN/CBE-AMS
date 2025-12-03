-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "assignedAssessorId" TEXT;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_assignedAssessorId_fkey" FOREIGN KEY ("assignedAssessorId") REFERENCES "Assessor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
