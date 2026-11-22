-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "checkDate" TIMESTAMP(3),
ADD COLUMN     "checkImage" TEXT,
ADD COLUMN     "checkNumber" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "checkDate" TIMESTAMP(3),
ADD COLUMN     "checkImage" TEXT,
ADD COLUMN     "checkNumber" TEXT,
ADD COLUMN     "method" TEXT;

-- CreateTable
CREATE TABLE "PlanTarget" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "sector" TEXT NOT NULL DEFAULT '',
    "amount" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanTarget_year_country_sector_key" ON "PlanTarget"("year", "country", "sector");
