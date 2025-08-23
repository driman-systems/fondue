import FormProduto from '@/components/FormProduto'
import { prisma } from '@/lib/prisma'

export default async function NovoProdutoPage() {
  const acompanhamentosDisponiveis = await prisma.topping.findMany({
    where: { ativo: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Novo Produto</h1>
      <FormProduto acompanhamentosDisponiveis={acompanhamentosDisponiveis} />
    </div>
  )
}
