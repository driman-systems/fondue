import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FiEdit, FiTrash, FiToggleLeft, FiToggleRight } from 'react-icons/fi'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

let errorMessage = ''

export default async function ProdutosPage() {
  const produtos = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      variations: true,
      productToppings: {
        include: { topping: true }
      }
    }
  })

  async function toggleAtivo(id: string, isActive: boolean) {
    'use server'
    await prisma.product.update({
      where: { id },
      data: { isActive }
    })
    revalidatePath('/admin/produtos')
  }

  async function excluirProduto(id: string) {
    'use server'

    const temVariacoes = await prisma.variation.findFirst({ where: { productId: id } })
    const temAcompanhamentos = await prisma.productTopping.findFirst({ where: { productId: id } })

    if (temVariacoes || temAcompanhamentos) {
      errorMessage = 'Este produto possui acompanhamentos. Exclua-os antes de remover.'
      redirect('/admin/produtos')
    }

    await prisma.product.delete({ where: { id } })
    revalidatePath('/admin/produtos')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="bg-[#4B1E00] text-yellow-400 px-4 py-2 rounded shadow hover:opacity-90"
        >
          Novo Produto
        </Link>
      </div>

      {errorMessage && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
          {errorMessage}
        </div>
      )}

      <table className="min-w-full bg-white shadow-md rounded overflow-hidden">
        <thead className="bg-gray-200 text-gray-700 text-left">
          <tr>
            <th className="p-4">Nome</th>
            <th className="p-4">Tipo</th>
            <th className="p-4">Preço</th>
            <th className="p-4">Ativo</th>
            <th className="p-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto) => (
            <tr key={produto.id} className="border-t border-gray-200 hover:bg-gray-50">
              <td className="p-4">{produto.name}</td>
              <td className="p-4 capitalize">{produto.type.toLowerCase()}</td>
              <td className="p-4">R$ {produto.price.toFixed(2).replace('.', ',')}</td>
              <td className="p-4">
                <form action={toggleAtivo.bind(null, produto.id, !produto.isActive)}>
                  <button title="Ativar/Desativar" className="text-xl">
                    {produto.isActive ? (
                      <FiToggleRight className="text-green-600" />
                    ) : (
                      <FiToggleLeft className="text-gray-400" />
                    )}
                  </button>
                </form>
              </td>
              <td className="p-4 flex gap-3 items-center">
                <Link href={`/admin/produtos/${produto.id}/editar`} title="Editar">
                  <FiEdit className="text-blue-600 hover:opacity-80 text-xl" />
                </Link>
                <form action={excluirProduto.bind(null, produto.id)}>
                  <button title="Excluir">
                    <FiTrash className="text-red-600 hover:opacity-80 text-xl" />
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
