-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('class', 'quiz');

-- CreateTable
CREATE TABLE "PublicItem" (
    "id" TEXT NOT NULL,
    "targetType" "TargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareItem" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "targetType" "TargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "TargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicItem_targetType_targetId_key" ON "PublicItem"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareItem_targetType_targetId_key" ON "ShareItem"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedAccess_userId_targetType_targetId_key" ON "SharedAccess"("userId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "ShareItem" ADD CONSTRAINT "ShareItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedAccess" ADD CONSTRAINT "SharedAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
