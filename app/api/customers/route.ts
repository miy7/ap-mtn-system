import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const errorResponse = (message: string, status: number, code: string) => NextResponse.json({ success: false, error: { code, message } }, { status, headers: { 'Cache-Control': 'no-store' } })
const text = (value: unknown, max = 160) => typeof value === 'string' ? value.trim().slice(0, max) : ''

export async function GET() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return errorResponse('กรุณาเข้าสู่ระบบ', 401, 'UNAUTHORIZED')
  const { data, error } = await supabase.from('customers').select('id, name, phone, email, notes, created_at, updated_at, customer_sites(id, name, address)').order('created_at', { ascending: false })
  if (error) return errorResponse('ไม่สามารถโหลดข้อมูลลูกค้าได้', 500, 'CUSTOMERS_LOAD_FAILED')
  return NextResponse.json({ success: true, data })
}

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return errorResponse('กรุณาเข้าสู่ระบบ', 401, 'UNAUTHORIZED')
  const body = await request.json().catch(() => null); const name = text(body?.name, 120); const phone = text(body?.phone, 40); const email = text(body?.email, 160); const notes = text(body?.notes, 1000)
  if (!name) return errorResponse('กรุณาระบุชื่อลูกค้า', 400, 'NAME_REQUIRED')
  const { data, error } = await supabase.from('customers').insert({ name, phone: phone || null, email: email || null, notes: notes || null }).select('id, name, phone, email, notes, created_at').single()
  if (error) return errorResponse('ไม่สามารถสร้างลูกค้าได้', 400, 'CUSTOMER_CREATE_FAILED')
  return NextResponse.json({ success: true, data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return errorResponse('กรุณาเข้าสู่ระบบ', 401, 'UNAUTHORIZED')
  const body = await request.json().catch(() => null); const id = text(body?.id, 50); const name = text(body?.name, 120); if (!id || !name) return errorResponse('ข้อมูลลูกค้าไม่ครบถ้วน', 400, 'INVALID_CUSTOMER')
  const { data, error } = await supabase.from('customers').update({ name, phone: text(body?.phone, 40) || null, email: text(body?.email, 160) || null, notes: text(body?.notes, 1000) || null, updated_at: new Date().toISOString() }).eq('id', id).select('id, name, phone, email, notes, updated_at').single()
  if (error) return errorResponse('ไม่สามารถแก้ไขลูกค้าได้', 400, 'CUSTOMER_UPDATE_FAILED'); return NextResponse.json({ success: true, data })
}
