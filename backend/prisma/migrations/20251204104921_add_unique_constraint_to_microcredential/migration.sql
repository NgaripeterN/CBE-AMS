/*
  Warnings:

  - A unique constraint covering the columns `[student_id,module_id]` on the table `MicroCredential` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MicroCredential_student_id_module_id_key" ON "MicroCredential"("student_id", "module_id");
