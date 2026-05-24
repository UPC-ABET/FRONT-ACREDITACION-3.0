import { NextRequest, NextResponse } from 'next/server'
import { s3Upload } from '@/lib/s3Server'

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key requerido' }, { status: 400 })
  try {
    const arrayBuffer = await req.arrayBuffer()
    await s3Upload(key, Buffer.from(arrayBuffer))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
