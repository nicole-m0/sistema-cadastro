-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "TeacherStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MusicLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "AuditEntity" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN_USER');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instruments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instruments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "socialName" TEXT,
    "document" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "specialty" TEXT,
    "hireDate" TIMESTAMP(3),
    "status" "TeacherStatus" NOT NULL DEFAULT 'ACTIVE',
    "photoUrl" TEXT,
    "photoPublicId" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_instruments" (
    "teacherId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,

    CONSTRAINT "teacher_instruments_pkey" PRIMARY KEY ("teacherId","instrumentId")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "socialName" TEXT,
    "birthDate" TIMESTAMP(3),
    "document" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "level" "MusicLevel" NOT NULL DEFAULT 'BEGINNER',
    "enrollmentDate" TIMESTAMP(3),
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "photoUrl" TEXT,
    "photoPublicId" TEXT,
    "notes" TEXT,
    "instrumentId" TEXT,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" "AuditEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_email_idx" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "instruments_name_key" ON "instruments"("name");

-- CreateIndex
CREATE INDEX "instruments_name_idx" ON "instruments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_document_key" ON "teachers"("document");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_email_key" ON "teachers"("email");

-- CreateIndex
CREATE INDEX "teachers_fullName_idx" ON "teachers"("fullName");

-- CreateIndex
CREATE INDEX "teachers_email_idx" ON "teachers"("email");

-- CreateIndex
CREATE INDEX "teachers_status_idx" ON "teachers"("status");

-- CreateIndex
CREATE INDEX "teachers_deletedAt_idx" ON "teachers"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "students_document_key" ON "students"("document");

-- CreateIndex
CREATE INDEX "students_fullName_idx" ON "students"("fullName");

-- CreateIndex
CREATE INDEX "students_email_idx" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_phone_idx" ON "students"("phone");

-- CreateIndex
CREATE INDEX "students_status_idx" ON "students"("status");

-- CreateIndex
CREATE INDEX "students_teacherId_idx" ON "students"("teacherId");

-- CreateIndex
CREATE INDEX "students_deletedAt_idx" ON "students"("deletedAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "teacher_instruments" ADD CONSTRAINT "teacher_instruments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_instruments" ADD CONSTRAINT "teacher_instruments_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

