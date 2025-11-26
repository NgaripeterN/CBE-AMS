-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'ASSESSOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'PENDING_PASSWORD_CHANGE');

-- CreateEnum
CREATE TYPE "public"."AssessmentGroup" AS ENUM ('FORMATIVE', 'SUMMATIVE');

-- CreateEnum
CREATE TYPE "public"."CredentialStatus" AS ENUM ('PENDING', 'ISSUED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."ModuleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "public"."CourseRole" AS ENUM ('LEAD', 'GRADER');

-- CreateEnum
CREATE TYPE "public"."ModuleRole" AS ENUM ('OWNER', 'GRADER');

-- CreateTable
CREATE TABLE "public"."User" (
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "department" TEXT,
    "regNumber" TEXT,
    "program" TEXT,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING_PASSWORD_CHANGE',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."Assessor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Assessor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletSettings" JSONB,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Course" (
    "course_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "minDescriptor" TEXT,
    "weighting" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "public"."Module" (
    "module_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "moduleCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."ModuleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("module_id")
);

-- CreateTable
CREATE TABLE "public"."CourseAssignment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "role" "public"."CourseRole" NOT NULL DEFAULT 'GRADER',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ModuleAssignment" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "role" "public"."ModuleRole" NOT NULL DEFAULT 'GRADER',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Assessment" (
    "assessment_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "submissionTypes" TEXT[],
    "group" "public"."AssessmentGroup" NOT NULL,
    "rubric" JSONB NOT NULL,
    "maxAttempts" INTEGER,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("assessment_id")
);

-- CreateTable
CREATE TABLE "public"."Enrollment" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "assessor_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Submission" (
    "submission_id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "grade" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("submission_id")
);

-- CreateTable
CREATE TABLE "public"."Observation" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "assessor_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "competencyTags" TEXT[],
    "numericScore" INTEGER,
    "descriptor" TEXT,
    "notes" TEXT,
    "media" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MicroCredential" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "descriptor" TEXT NOT NULL,
    "score" INTEGER,
    "issuedAt" TIMESTAMP(3),
    "txHash" TEXT,
    "status" "public"."CredentialStatus" NOT NULL DEFAULT 'PENDING',
    "payloadJson" JSONB NOT NULL,

    CONSTRAINT "MicroCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseCredential" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "descriptor" TEXT NOT NULL,
    "evidenceModuleIds" TEXT[],
    "evidenceMicroCredentialIds" TEXT[],
    "issuedAt" TIMESTAMP(3),
    "txHash" TEXT,
    "status" "public"."CredentialStatus" NOT NULL DEFAULT 'PENDING',
    "payloadJson" JSONB NOT NULL,

    CONSTRAINT "CourseCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Audit" (
    "id" TEXT NOT NULL,
    "who" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_regNumber_key" ON "public"."User"("regNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Assessor_userId_key" ON "public"."Assessor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "public"."Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "public"."Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Module_course_id_moduleCode_key" ON "public"."Module"("course_id", "moduleCode");

-- CreateIndex
CREATE UNIQUE INDEX "CourseAssignment_courseId_assessorId_key" ON "public"."CourseAssignment"("courseId", "assessorId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleAssignment_moduleId_assessorId_key" ON "public"."ModuleAssignment"("moduleId", "assessorId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_module_id_assessor_id_student_id_key" ON "public"."Enrollment"("module_id", "assessor_id", "student_id");

-- AddForeignKey
ALTER TABLE "public"."Assessor" ADD CONSTRAINT "Assessor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Module" ADD CONSTRAINT "Module_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."Course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseAssignment" ADD CONSTRAINT "CourseAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseAssignment" ADD CONSTRAINT "CourseAssignment_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "public"."Assessor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModuleAssignment" ADD CONSTRAINT "ModuleAssignment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."Module"("module_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModuleAssignment" ADD CONSTRAINT "ModuleAssignment_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "public"."Assessor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assessment" ADD CONSTRAINT "Assessment_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."Module"("module_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."Module"("module_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_assessor_id_fkey" FOREIGN KEY ("assessor_id") REFERENCES "public"."Assessor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."Assessment"("assessment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Observation" ADD CONSTRAINT "Observation_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."Module"("module_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Observation" ADD CONSTRAINT "Observation_assessor_id_fkey" FOREIGN KEY ("assessor_id") REFERENCES "public"."Assessor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Observation" ADD CONSTRAINT "Observation_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MicroCredential" ADD CONSTRAINT "MicroCredential_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MicroCredential" ADD CONSTRAINT "MicroCredential_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."Module"("module_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseCredential" ADD CONSTRAINT "CourseCredential_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseCredential" ADD CONSTRAINT "CourseCredential_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."Course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;