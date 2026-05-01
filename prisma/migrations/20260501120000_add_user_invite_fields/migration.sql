-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "inviteToken" TEXT,
  ADD COLUMN "inviteExpires" TIMESTAMP(3),
  ADD COLUMN "invitedBy" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteToken_key" ON "User"("inviteToken");

-- CreateIndex
CREATE INDEX "User_inviteToken_idx" ON "User"("inviteToken");
