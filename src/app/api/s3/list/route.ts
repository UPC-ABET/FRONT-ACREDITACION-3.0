import { NextRequest, NextResponse } from 'next/server'
import { s3ListDirectory } from '@/lib/s3Server'

export async function GET(req: NextRequest) {
  const dir = req.nextUrl.searchParams.get('dir') ?? ''
  try {
    const data = await s3ListDirectory(dir)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[s3/list] Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
