import { NextResponse } from 'next/server'
import { s3ListAllKeys } from '@/lib/s3Server'

export async function GET() {
  try {
    const keys = await s3ListAllKeys()
    return NextResponse.json({ keys })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
