import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const priorities = new Set(['LOW', 'NORMAL', 'HIGH', 'URGENT'])

const jsonHeaders = { 'Cache-Control': 'no-store' }

function response(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: jsonHeaders })
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') {
      return response({ success: false, error: { code: 'VALIDATION_ERROR', message: 'ข้อมูลคำขอไม่ถูกต้อง' } }, 400)
    }

    const input = body as Record<string, unknown>
    const qrCode = typeof input.qrCode === 'string' ? input.qrCode.trim() : ''
    const assetNumber = typeof input.assetNumber === 'string' ? input.assetNumber.trim() : ''
    const problem = typeof input.problem === 'string' ? input.problem.trim() : ''
    const contactName = typeof input.contactName === 'string' ? input.contactName.trim() : ''
    const phone = typeof input.phone === 'string' ? input.phone.trim() : ''
    const priority = typeof input.priority === 'string' && priorities.has(input.priority) ? input.priority : 'NORMAL'

    if (!qrCode || !assetNumber || !problem || !contactName || !phone) {
      return response({ success: false, error: { code: 'VALIDATION_ERROR', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' } }, 400)
    }
    if (qrCode.length > 120 || assetNumber.length > 100 || problem.length > 2000 || contactName.length > 120 || phone.length > 30) {
      return response({ success: false, error: { code: 'VALIDATION_ERROR', message: 'ข้อมูลยาวเกินกำหนด' } }, 400)
    }
    if (!/^[+0-9()\-\s]{7,30}$/.test(phone)) {
      return response({ success: false, error: { code: 'VALIDATION_ERROR', message: 'กรุณาตรวจสอบเบอร์โทรศัพท์' } }, 400)
    }

    const supabase = await createClient()
    const { data: qr, error: qrError } = await supabase
      .from('qr_codes')
      .select('id, site_id')
      .eq('code', qrCode)
      .eq('active', true)
      .maybeSingle()
    if (qrError) throw qrError
    if (!qr) return response({ success: false, error: { code: 'QR_NOT_FOUND', message: 'ไม่พบ QR Code ที่ใช้งานอยู่' } }, 404)

    const { data: site, error: siteError } = await supabase
      .from('customer_sites')
      .select('id, customer_id')
      .eq('id', qr.site_id)
      .maybeSingle()
    if (siteError) throw siteError
    if (!site) return response({ success: false, error: { code: 'SITE_NOT_FOUND', message: 'ไม่พบสถานที่ของ QR Code นี้' } }, 404)

    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('id')
      .eq('site_id', qr.site_id)
      .eq('asset_number', assetNumber)
      .maybeSingle()
    if (assetError) throw assetError

    const { data: created, error: insertError } = await supabase
      .from('maintenance_requests')
      .insert({
        qr_code_id: qr.id,
        customer_id: site.customer_id,
        site_id: qr.site_id,
        asset_id: asset?.id ?? null,
        asset_number: assetNumber,
        problem,
        contact_name: contactName,
        phone,
        priority,
      })
      .select('request_number')
      .single()
    if (insertError) throw insertError

    return response({ success: true, data: created }, 201)
  } catch {
    return response({ success: false, error: { code: 'REQUEST_FAILED', message: 'ไม่สามารถสร้างคำขอได้ในขณะนี้' } }, 500)
  }
}
