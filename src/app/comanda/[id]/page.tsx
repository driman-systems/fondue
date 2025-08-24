// src/app/comanda/[id]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
}

export default async function ComandaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ auto?: string }>
}) {
  const { id } = await params
  const { auto } = await searchParams

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      payments: true,
      cashRegister: { include: { openedBy: true } },
    },
  })

  if (!order) return notFound()

  const createdAt = new Date(order.createdAt)

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Comanda {order.id.slice(0, 8)}</title>
        <style>{`
          @page { size: 80mm auto; margin: 6mm; }
          body { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
          .ticket { width: 72mm; }
          .center { text-align: center; }
          .right { text-align: right; }
          .row { display: flex; justify-content: space-between; gap: 8px; }
          .muted { color: #555; font-size: 12px; }
          hr { border: none; border-top: 1px dashed #aaa; margin: 8px 0; }
          h3 { margin: 8px 0; }
          .logo { width: 42mm; height: auto; margin: 0 auto 6px; display: block; }
          .item { margin-bottom: 6px; }
          .sub { font-size: 12px; color: #333; margin-top: 2px; white-space: pre-wrap; }
        `}</style>
        {auto === '1' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.addEventListener('load',()=>{window.print(); setTimeout(()=>window.close(), 300)})`,
            }}
          />
        )}
      </head>
      <body>
        <div className="ticket">
          <div className="center">
            {/* Logo via next/image (unoptimized para impressão) */}
            <Image
              src="/logo.png"
              alt="logo"
              width={420}
              height={180}
              className="logo"
              priority
              unoptimized
            />
            <h3>COMANDA</h3>
            <div className="muted">
              Pedido #{order.id.slice(0, 8)} • Caixa #{order.cashRegister?.number ?? '—'}
            </div>
            <div className="muted">
              {createdAt.toLocaleDateString('pt-BR')} {createdAt.toLocaleTimeString('pt-BR')}
            </div>
          </div>

          <hr />

          {order.items.map((it) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const d = (it as any).details as { chocolate?: string | null; toppings?: string[] } | null
            const chocolate = d?.chocolate ? `Chocolate: ${d.chocolate}` : ''
            const toppings =
              d?.toppings && d.toppings.length ? `Acomp.: ${d.toppings.join(', ')}` : ''

            return (
              <div key={it.id} className="item">
                <div className="row">
                  <div>
                    {it.quantity}x {it.product.name}
                  </div>
                  <div className="right">{fmt(it.product.price * it.quantity)}</div>
                </div>
                {(chocolate || toppings) && (
                  <div className="sub">
                    {[chocolate, toppings].filter(Boolean).join('\n')}
                  </div>
                )}
              </div>
            )
          })}

          {order.notes && (
            <>
              <hr />
              <div>
                <strong>Obs:</strong> {order.notes}
              </div>
            </>
          )}

          <hr />

          <div className="row">
            <strong>Total</strong>
            <strong>{fmt(order.total || 0)}</strong>
          </div>

          <hr />
          <div>
            <div className="muted">Pagamentos:</div>
            {order.payments.map((p) => (
              <div key={p.id} className="row">
                <div>{p.method}</div>
                <div className="right">{fmt(p.value)}</div>
              </div>
            ))}
          </div>

          <hr />
          <div className="center muted">Obrigado e volte sempre!</div>
        </div>
      </body>
    </html>
  )
}
