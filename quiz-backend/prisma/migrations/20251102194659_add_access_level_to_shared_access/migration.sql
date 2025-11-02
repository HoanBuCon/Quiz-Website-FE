-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('full', 'navigationOnly');

-- AlterTable
ALTER TABLE "SharedAccess" ADD COLUMN     "accessLevel" "AccessLevel" NOT NULL DEFAULT 'full';
