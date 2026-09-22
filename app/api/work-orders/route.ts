import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const WORK_ORDER_STATUSES = new Set(['PENDING', 'ASSIGNED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'WAITING_PART', 'WAITING_CUSTOMER', 'COMPLETED', 'CLOSED', 'CANCELLED'])

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
  const status = typeof input.status === 'string' ? input.status : 'PENDING'
  const assignedTechnician = typeof input.assigned_technician === 'string' ? input.assigned_technician.trim() : null
  const scheduledAt = typeof input.scheduled_at === 'string' ? input.scheduled_at : null
  if (!UUID_PATTERN.test(requestId)) return errorResponse('ไม่พบรายการแจ้งซ่อม', 400, 'INVALID_REQUEST_ID')
  if (!WORK_ORDER_STATUSES.has(status)) return errorResponse('สถานะงานไม่ถูกต้อง', 400, 'INVALID_STATUS')
  if (assignedTechnician && assignedTechnician.length > 120) return errorResponse('ชื่อช่างยาวเกินไป', 400, 'INVALID_TECHNICIAN')
  if (scheduledAt && Number.isNaN(Date.parse(scheduledAt))) return errorResponse('วันเวลานัดหมายไม่ถูกต้อง', 400, 'INVALID_SCHEDULE')

  const { data: maintenanceRequest, error: requestError } = await supabase.from('maintenance_requests').select('id, customer_id, site_id, status').eq('id', requestId).single()
  if (requestError || !maintenanceRequest) return errorResponse('ไม่พบรายการแจ้งซ่อม', 404, 'REQUEST_NOT_FOUND')
  if (maintenanceRequest.status === 'CANCELLED') return errorResponse('ไม่สามารถสร้างงานจากรายการที่ยกเลิกแล้ว', 409, 'REQUEST_CANCELLED')
  if (maintenanceRequest.status === 'CONVERTED_TO_WORK_ORDER') return errorResponse('รายการนี้ถูกสร้างเป็นใบงานแล้ว', 409, 'ALREADY_CONVERTED')

  const { data: workOrder, error: workOrderError } = await supabase.from('work_orders').insert({ request_id: requestId, customer_id: maintenanceRequest.customer_id, site_id: maintenanceRequest.site_id, status, assigned_technician: assignedTechnician, scheduled_at: scheduledAt }).select('id, work_order_number, status').single()
  if (workOrderError) return errorResponse('ไม่สามารถสร้างใบงานได้', 500, 'WORK_ORDER_CREATE_FAILED')

  const { error: updateError } = await supabase.from('maintenance_requests').update({ status: 'CONVERTED_TO_WORK_ORDER', updated_at: new Date().toISOString() }).eq('id', requestId)
  if (updateError) return errorResponse('สร้างใบงานแล้ว แต่ไม่สามารถอัปเดตสถานะรายการแจ้งซ่อมได้', 500, 'REQUEST_STATUS_UPDATE_FAILED')

  await supabase.from('audit_logs').insert({ actor_id: user.id, action: 'CREATE_WORK_ORDER', entity: 'work_order', entity_id: workOrder.id, after_data: workOrder })
  return NextResponse.json({ success: true, data: workOrder }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
