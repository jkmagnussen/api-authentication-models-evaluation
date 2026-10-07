ALTER TABLE "OAuthAccessToken"
ADD COLUMN "refreshExpiresAt" TIMESTAMP(3);

UPDATE "OAuthAccessToken"
SET "refreshExpiresAt" = "expiresAt" + INTERVAL '30 days'
WHERE "refreshExpiresAt" IS NULL;

ALTER TABLE "OAuthAccessToken"
ALTER COLUMN "refreshExpiresAt" SET NOT NULL;