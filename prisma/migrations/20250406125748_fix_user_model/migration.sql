/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nationalCode` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dateOfBirth` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `quranicStudyLevel` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nationalCardPicture` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'STUDENT', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ALTER COLUMN "nationalCode" SET NOT NULL,
ALTER COLUMN "dateOfBirth" SET NOT NULL,
ALTER COLUMN "quranicStudyLevel" SET NOT NULL,
ALTER COLUMN "nationalCardPicture" SET NOT NULL;
