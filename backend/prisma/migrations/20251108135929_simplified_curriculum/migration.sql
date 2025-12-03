/*
  Warnings:

  - You are about to drop the `CurriculumModule` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "semesterOfStudy" INTEGER,
ADD COLUMN     "yearOfStudy" INTEGER;

-- AlterTable
ALTER TABLE "Offering" DROP COLUMN "curriculumModuleId",
ADD COLUMN     "moduleId" TEXT;

-- DropTable
DROP TABLE "CurriculumModule";

-- AddForeignKey
ALTER TABLE "Offering" ADD CONSTRAINT "Offering_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("module_id") ON DELETE RESTRICT ON UPDATE CASCADE;
