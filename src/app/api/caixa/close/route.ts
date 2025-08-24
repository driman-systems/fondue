import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('caixa_open')
  res.cookies.delete('caixa_number')
  return res
}
