/*
  Warnings:

  - Added the required column `cashRegisterId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "cashRegisterId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "public"."DailyCashRegister"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
