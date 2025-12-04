/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `CourseCredential` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shareToken]` on the table `MicroCredential` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CourseCredential" ADD COLUMN     "shareToken" TEXT,
ADD COLUMN     "shareTokenExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MicroCredential" ADD COLUMN     "shareToken" TEXT,
ADD COLUMN     "shareTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "CourseCredential_shareToken_key" ON "CourseCredential"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "MicroCredential_shareToken_key" ON "MicroCredential"("shareToken");
