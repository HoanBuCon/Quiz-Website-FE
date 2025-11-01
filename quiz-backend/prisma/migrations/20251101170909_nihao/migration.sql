-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuestionType" ADD VALUE 'drag';
ALTER TYPE "QuestionType" ADD VALUE 'composite';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
