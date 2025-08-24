'use client'
import HeaderPOS from '@/components/frente/HeaderPOS'
import ListaProdutos from '@/components/frente/ListaProdutos'
import PedidoResumo from '@/components/frente/PedidoResumo'

export default function HomePOS() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <HeaderPOS />
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-12 gap-4">
          <section className="col-span-12 lg:col-span-8">
            <div className="rounded-2xl border border-zinc-800 p-3">
              <ListaProdutos />
            </div>
          </section>
          <aside className="col-span-12 lg:col-span-4">
            <div className="rounded-2xl border border-zinc-800 p-3 sticky top-4">
              <PedidoResumo />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
