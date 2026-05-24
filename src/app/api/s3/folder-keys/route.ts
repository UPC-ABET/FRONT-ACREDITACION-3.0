import { NextRequest, NextResponse } from 'next/server'
import { s3GetFolderKeys } from '@/lib/s3Server'

export async function GET(req: NextRequest) {
  const prefix = req.nextUrl.searchParams.get('prefix') ?? ''
  try {
    const files = await s3GetFolderKeys(prefix)
    return NextResponse.json({ files })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
