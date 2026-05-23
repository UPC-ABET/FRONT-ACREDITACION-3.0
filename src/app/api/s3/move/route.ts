import { NextRequest, NextResponse } from 'next/server'
import { s3Move } from '@/lib/s3Server'

export async function POST(req: NextRequest) {
  const { stack, dir } = await req.json()
  if (!Array.isArray(stack)) return NextResponse.json({ error: 'stack requerido' }, { status: 400 })
  try {
    const ok = await s3Move(stack, dir ?? '')
    return NextResponse.json({ ok })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
