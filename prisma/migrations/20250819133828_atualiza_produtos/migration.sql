-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "quantidadeAcompanhamentos" INTEGER,
ADD COLUMN     "usaAcompanhamentos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usaChocolate" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."Topping" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "precoExtra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Topping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductTopping" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "toppingId" TEXT NOT NULL,

    CONSTRAINT "ProductTopping_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ProductTopping" ADD CONSTRAINT "ProductTopping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductTopping" ADD CONSTRAINT "ProductTopping_toppingId_fkey" FOREIGN KEY ("toppingId") REFERENCES "public"."Topping"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
