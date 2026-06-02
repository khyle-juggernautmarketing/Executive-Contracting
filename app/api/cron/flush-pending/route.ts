import { NextResponse } from 'next/server'
import { flushExpiredPendingLeads } from '@/lib/pendingLeads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return process.env.NODE_ENV === 'development'

  const auth = request.headers.get('authorization') ?? ''
  if (auth === `Bearer ${secret}`) return true

  const vercelCron = request.headers.get('x-vercel-cron')
  return vercelCron === '1' && Boolean(secret)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const flushed = await flushExpiredPendingLeads()
  return NextResponse.json({ ok: true, flushed })
}

export async function POST(request: Request) {
  return GET(request)
}
