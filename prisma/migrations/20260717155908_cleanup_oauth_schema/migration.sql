/*
  Warnings:

  - You are about to drop the column `redirectUri` on the `OAuthAuthorizationCode` table. All the data in the column will be lost.
  - You are about to drop the column `redirectUri` on the `OAuthClient` table. All the data in the column will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `oAuthAccessToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "oAuthAccessToken" DROP CONSTRAINT "oAuthAccessToken_userId_fkey";

-- AlterTable
ALTER TABLE "OAuthAuthorizationCode" DROP COLUMN "redirectUri";

-- AlterTable
ALTER TABLE "OAuthClient" DROP COLUMN "redirectUri";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "oAuthAccessToken";

-- CreateTable
CREATE TABLE "OAuthAccessToken" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccessToken_accessToken_key" ON "OAuthAccessToken"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccessToken_refreshToken_key" ON "OAuthAccessToken"("refreshToken");

-- AddForeignKey
ALTER TABLE "OAuthAuthorizationCode" ADD CONSTRAINT "OAuthAuthorizationCode_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "OAuthClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccessToken" ADD CONSTRAINT "OAuthAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccessToken" ADD CONSTRAINT "OAuthAccessToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "OAuthClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
