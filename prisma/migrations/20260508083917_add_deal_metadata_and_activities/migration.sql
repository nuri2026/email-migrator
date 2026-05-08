/*
  Warnings:

  - Added the required column `updatedAt` to the `brevo_deal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "brevo_deal" ADD COLUMN     "closeDate" TIMESTAMP(3),
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "dealOwner" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "brevo_activity" (
    "id" TEXT NOT NULL,
    "brevoId" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "dealId" TEXT NOT NULL,
    "hubspotId" TEXT,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brevo_activity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "brevo_activity" ADD CONSTRAINT "brevo_activity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "brevo_deal"("brevoId") ON DELETE RESTRICT ON UPDATE CASCADE;
