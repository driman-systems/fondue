/*
  Warnings:

  - You are about to drop the column `customer` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `Order` table. All the data in the column will be lost.
  - Added the required column `cashRegisterId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "customer",
DROP COLUMN "note",
ADD COLUMN     "cashRegisterId" TEXT NOT NULL,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "public"."DailyCashRegister" (
    "id" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "initialCash" DOUBLE PRECISION NOT NULL,
    "finalCash" DOUBLE PRECISION,
    "openedById" TEXT NOT NULL,
    "closedById" TEXT,

    CONSTRAINT "DailyCashRegister_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "public"."DailyCashRegister"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyCashRegister" ADD CONSTRAINT "DailyCashRegister_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyCashRegister" ADD CONSTRAINT "DailyCashRegister_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
