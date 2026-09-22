import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: requests } = await supabase.from('maintenance_requests').select('id, request_number, asset_number, problem, priority, status, created_at').order('created_at', { ascending: false }).limit(25)

  return <main className="shell"><section className="main"><div className="top"><div><div className="eyebrow">Internal workspace</div><h1>Maintenance requests</h1><p className="sub">รายการแจ้งซ่อมล่าสุดสำหรับทีมงาน</p></div><div className="actions"><form action="/auth/signout" method="post"><button className="btn">ออกจากระบบ</button></form></div></div><div className="card" style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr><th>เลขที่</th><th>อุปกรณ์</th><th>ปัญหา</th><th>ความเร่งด่วน</th><th>สถานะ</th></tr></thead><tbody>{requests?.length ? requests.map((request) => <tr key={request.id}><td>{request.request_number}</td><td>{request.asset_number}</td><td>{request.problem}</td><td>{request.priority}</td><td>{request.status}</td></tr>) : <tr><td colSpan={5}>ยังไม่มีรายการแจ้งซ่อม</td></tr>}</tbody></table></div></section></main>
}
