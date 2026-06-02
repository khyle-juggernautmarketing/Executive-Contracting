import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Legacy endpoint — leads must complete scheduling or wait for the 10-minute timeout. */
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Please complete appointment scheduling after the form, or wait for automatic submission.',
    },
    { status: 400 },
  )
}
