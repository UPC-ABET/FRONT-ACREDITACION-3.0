import { NextRequest, NextResponse } from 'next/server'
import { s3GetPresignedUrl } from '@/lib/s3Server'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  const expires = Number(req.nextUrl.searchParams.get('expires') ?? '3600')
  if (!key) return NextResponse.json({ error: 'key requerido' }, { status: 400 })
  try {
    const url = await s3GetPresignedUrl(key, expires)
    return NextResponse.json({ url })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
