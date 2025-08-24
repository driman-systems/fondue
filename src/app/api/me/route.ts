/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const revalidate = 0

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ name: 'Usuário', role: 'GUEST' })
  }

  return NextResponse.json({
    id: (session.user as any)?.id ?? null,
    name: session.user?.name ?? session.user?.email?.split('@')[0] ?? 'Usuário',
    email: session.user?.email ?? null,
    role: (session.user as any)?.role ?? 'USER',
  })
}
