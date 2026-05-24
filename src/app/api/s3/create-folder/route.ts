import { NextRequest, NextResponse } from 'next/server'
import { s3CreateFolder } from '@/lib/s3Server'

export async function POST(req: NextRequest) {
  const { name, path } = await req.json()
  if (!name) return NextResponse.json({ error: 'name requerido' }, { status: 400 })
  try {
    const uniqueName = await s3CreateFolder(name, path ?? '')
    return NextResponse.json({ ok: true, uniqueName })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
