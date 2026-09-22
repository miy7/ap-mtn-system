import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next')
  const destination = next?.startsWith('/') && !next.startsWith('//') ? next : '/protected'
  if (code) {
    const { error } = await (await createClient()).auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(destination, request.url))
  }
  return NextResponse.redirect(new URL('/auth/login?error=callback', request.url))
}
