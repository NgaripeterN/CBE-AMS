/*
  Warnings:

  - A unique constraint covering the columns `[student_id,course_id]` on the table `CourseCredential` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CourseCredential_student_id_course_id_key" ON "CourseCredential"("student_id", "course_id");
