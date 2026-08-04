-- CreateEnum
CREATE TYPE "OtpChannel" AS ENUM ('EMAIL', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'ATTACH_EMAIL', 'ATTACH_PHONE', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "TelegramProfile" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "channel" "OtpChannel" NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "identifier" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "userId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtpCode_identifier_purpose_consumedAt_idx" ON "OtpCode"("identifier", "purpose", "consumedAt");

-- CreateIndex
CREATE INDEX "OtpCode_expiresAt_idx" ON "OtpCode"("expiresAt");

-- CreateIndex
CREATE INDEX "OtpCode_userId_idx" ON "OtpCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramProfile_phone_key" ON "TelegramProfile"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "OtpCode" ADD CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

