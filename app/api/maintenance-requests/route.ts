import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const priorities = new Set(['LOW', 'NORMAL', 'HIGH', 'URGENT'])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const qrCode = typeof body.qrCode === 'string' ? body.qrCode.trim() : ''
    const assetNumber = typeof body.assetNumber === 'string' ? body.assetNumber.trim() : ''
    const problem = typeof body.problem === 'string' ? body.problem.trim() : ''
    const contactName = typeof body.contactName === 'string' ? body.contactName.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const priority = priorities.has(body.priority) ? body.priority : 'NORMAL'
    if (!qrCode || !assetNumber || !problem || !contactName || !phone) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' } }, { status: 400 })
    if (problem.length > 2000 || assetNumber.length > 100 || contactName.length > 120) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'ข้อมูลยาวเกินกำหนด' } }, { status: 400 })

    const supabase = await createClient()
    const { data: qr } = await supabase.from('qr_codes').select('id, site_id').eq('code', qrCode).eq('active', true).maybeSingle()
    if (!qr) return NextResponse.json({ success: false, error: { code: 'QR_NOT_FOUND', message: 'ไม่พบ QR Code ที่ใช้งานอยู่' } }, { status: 404 })
    const { data: site } = await supabase.from('customer_sites').select('id, customer_id').eq('id', qr.site_id).maybeSingle()
    if (!site) return NextResponse.json({ success: false, error: { code: 'SITE_NOT_FOUND', message: 'ไม่พบสถานที่ของ QR Code นี้' } }, { status: 404 })
    const { data: asset } = await supabase.from('assets').select('id').eq('site_id', qr.site_id).eq('asset_number', assetNumber).maybeSingle()
    const { error } = await supabase.from('maintenance_requests').insert({ qr_code_id: qr.id, customer_id: site.customer_id, site_id: qr.site_id, asset_id: asset?.id ?? null, asset_number: assetNumber, problem, contact_name: contactName, phone, priority })
    if (error) throw error
    return NextResponse.json({ success: true, data: { request_number: null } })
  } catch {
    return NextResponse.json({ success: false, error: { code: 'REQUEST_FAILED', message: 'ไม่สามารถสร้างคำขอได้ในขณะนี้' } }, { status: 500 })
  }
}
