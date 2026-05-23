import { NextRequest, NextResponse } from 'next/server'
import { s3Rename } from '@/lib/s3Server'

export async function POST(req: NextRequest) {
  const { key, name } = await req.json()
  if (!key || !name) return NextResponse.json({ error: 'key y name requeridos' }, { status: 400 })
  try {
    const ok = await s3Rename(key, name)
    return NextResponse.json({ ok })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
