import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return errorResponse('กรุณาเข้าสู่ระบบ', 401, 'UNAUTHORIZED')

  let body: unknown
  try { body = await request.json() } catch { return errorResponse('ข้อมูลคำขอไม่ถูกต้อง', 400, 'INVALID_JSON') }
  if (!body || typeof body !== 'object') return errorResponse('ข้อมูลคำขอไม่ถูกต้อง', 400, 'INVALID_BODY')

  const input = body as Record<string, unknown>
  const requestId = typeof input.request_id === 'string' ? input.request_id : ''
  const priority = typeof input.priority === 'string' ? input.priority : 'NORMAL'
  if (!UUID_PATTERN.test(requestId)) return errorResponse('ไม่พบรายการแจ้งซ่อม', 400, 'INVALID_REQUEST_ID')
  if (!['NORMAL', 'HIGH', 'URGENT'].includes(priority)) return errorResponse('ระดับความสำคัญไม่ถูกต้อง', 400, 'INVALID_PRIORITY')

  const { data: maintenanceRequest, error: requestError } = await supabase.from('maintenance_requests').select('id, customer_id, site_id, asset_id, status').eq('id', requestId).single()
  if (requestError || !maintenanceRequest) return errorResponse('ไม่พบรายการแจ้งซ่อม', 404, 'REQUEST_NOT_FOUND')
  if (!maintenanceRequest.asset_id) return errorResponse('รายการนี้ยังไม่มีอุปกรณ์ที่ตรวจสอบได้', 400, 'EQUIPMENT_REQUIRED')

  const { data: workOrder, error: workOrderError } = await supabase.rpc('create_work_order_atomic', {
    p_request_id: requestId,
    p_customer_id: maintenanceRequest.customer_id,
    p_site_id: maintenanceRequest.site_id,
    p_equipment_id: maintenanceRequest.asset_id,
    p_problem: '',
    p_priority: priority,
    p_assigned_staff: null,
  }).select('id, work_order_number, system_type, status, priority')

  if (workOrderError || !workOrder) {
    const message = workOrderError?.message ?? ''
    if (message.includes('invalid request scope')) return errorResponse('รายการนี้ถูกยกเลิกหรือถูกสร้างเป็นใบงานแล้ว', 409, 'REQUEST_NOT_CONVERTIBLE')
    if (message.includes('invalid equipment scope')) return errorResponse('อุปกรณ์ไม่สอดคล้องกับลูกค้าหรือไซต์', 400, 'INVALID_ASSET_SCOPE')
    return errorResponse('ไม่สามารถสร้างใบงานได้', 500, 'WORK_ORDER_CREATE_FAILED')
  }

  return NextResponse.json({ success: true, data: workOrder }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
