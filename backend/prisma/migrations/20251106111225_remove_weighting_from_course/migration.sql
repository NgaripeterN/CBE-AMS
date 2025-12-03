/*
  Warnings:

  - You are about to drop the column `minDescriptor` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `weighting` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "minDescriptor",
DROP COLUMN "weighting";
