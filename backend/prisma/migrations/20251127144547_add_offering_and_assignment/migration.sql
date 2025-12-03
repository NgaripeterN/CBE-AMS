-- CreateTable
CREATE TABLE "Offering" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,

    CONSTRAINT "Offering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingAssignment" (
    "offeringId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,

    CONSTRAINT "OfferingAssignment_pkey" PRIMARY KEY ("offeringId","assessorId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Offering_moduleId_semesterId_key" ON "Offering"("moduleId", "semesterId");

-- AddForeignKey
ALTER TABLE "Offering" ADD CONSTRAINT "Offering_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("module_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offering" ADD CONSTRAINT "Offering_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingAssignment" ADD CONSTRAINT "OfferingAssignment_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingAssignment" ADD CONSTRAINT "OfferingAssignment_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "Assessor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
