/*
  Warnings:

  - Added the required column `number` to the `DailyCashRegister` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."DailyCashRegister" ADD COLUMN     "number" INTEGER NOT NULL;
