/*
  Warnings:

  - Added the required column `clientId` to the `OAuthAuthorizationCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `redirectUri` to the `OAuthAuthorizationCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OAuthAuthorizationCode" ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "redirectUri" TEXT NOT NULL,
ADD COLUMN     "state" TEXT;
