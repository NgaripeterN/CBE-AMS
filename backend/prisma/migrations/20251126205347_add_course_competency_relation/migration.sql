-- CreateTable
CREATE TABLE "_CourseCompetencies" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CourseCompetencies_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CourseCompetencies_B_index" ON "_CourseCompetencies"("B");

-- AddForeignKey
ALTER TABLE "_CourseCompetencies" ADD CONSTRAINT "_CourseCompetencies_A_fkey" FOREIGN KEY ("A") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseCompetencies" ADD CONSTRAINT "_CourseCompetencies_B_fkey" FOREIGN KEY ("B") REFERENCES "Course"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;
