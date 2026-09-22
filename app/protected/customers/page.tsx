import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function CustomersPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/auth/login')
  const { data: customerRows } = await supabase.from('customers').select('id, name, phone, email, created_at, customer_sites(id, name, address)').order('created_at', { ascending: false })
  return <main className="internal-content"><a className="back-link" href="/">← Home</a><div className="welcome-row"><div><p className="eyebrow">Directory</p><h1>Customers</h1><p className="sub">ลูกค้าและสถานที่ติดตั้งจากระบบจริง</p></div></div><section className="surface work-order-surface"><div className="order-list">{(customerRows ?? []).map((customer: any) => <article className="order-row" key={customer.id}><div className="order-main"><span className="order-id">CUSTOMER</span><h3>{customer.name}</h3><p>{customer.phone || 'ไม่มีเบอร์ติดต่อ'} · {(customer.customer_sites ?? []).length} sites</p></div><div className="order-meta"><span>{(customer.customer_sites ?? []).map((site: any) => site.name).join(', ') || 'ยังไม่มี site'}</span><time>{new Date(customer.created_at).toLocaleDateString('th-TH')}</time></div></article>)}{!(customerRows ?? []).length && <p className="empty-message">ยังไม่มีข้อมูลลูกค้า</p>}</div></section></main>
}
