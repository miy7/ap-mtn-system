import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MaintenanceHome } from '@/components/maintenance-home'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data } = await supabase.from('work_orders').select('id, work_order_number, status, created_at, maintenance_requests(problem, priority, asset_number, customers(name))').order('created_at', { ascending: false }).limit(8)
  const orders = (data ?? []).map((row: any) => ({ id: row.work_order_number, customer: row.maintenance_requests?.customers?.name ?? 'ไม่ระบุลูกค้า', equipment: row.maintenance_requests?.asset_number ?? 'ไม่ระบุอุปกรณ์', issue: row.maintenance_requests?.problem ?? 'ไม่มีรายละเอียด', status: row.status, priority: row.maintenance_requests?.priority ?? 'NORMAL', date: new Date(row.created_at).toLocaleDateString('th-TH') }))
  return <MaintenanceHome orders={orders} />
}
