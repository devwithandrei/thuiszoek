CREATE TYPE "ProviderType" AS ENUM ('PRIVATE_PERSON', 'AGENCY');

CREATE TYPE "SearchPreference" AS ENUM ('RENT', 'BUY', 'BOTH');

ALTER TABLE "User"
ADD COLUMN "providerType" "ProviderType",
ADD COLUMN "searchPreference" "SearchPreference",
ADD COLUMN "preferredCity" TEXT;

UPDATE "User"
SET "providerType" = 'AGENCY'
WHERE "role" = 'PROVIDER';
