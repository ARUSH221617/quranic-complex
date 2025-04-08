-- AlterTable
ALTER TABLE "User" ADD COLUMN     "loginCode" TEXT,
ADD COLUMN     "loginCodeExpires" TIMESTAMP(3);
