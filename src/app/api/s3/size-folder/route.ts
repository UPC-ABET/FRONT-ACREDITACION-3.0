import { NextRequest, NextResponse } from 'next/server'
import { s3GetSizeFolder } from '@/lib/s3Server'

export async function GET(req: NextRequest) {
  const dir = req.nextUrl.searchParams.get('dir') ?? ''
  try {
    const { size, modified } = await s3GetSizeFolder(dir)
    return NextResponse.json({ size, modified: modified?.toISOString() ?? null })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
