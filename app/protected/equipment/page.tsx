import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function EquipmentPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/auth/login')
  const { data: assetRows } = await supabase.from('assets').select('id, asset_number, name, system_type, status, location, customer_id, customers(name), customer_sites(name, address)').order('created_at', { ascending: false })
  return <main className="internal-content"><a className="back-link" href="/">← Home</a><div className="welcome-row"><div><p className="eyebrow">Asset register</p><h1>Equipment</h1><p className="sub">อุปกรณ์ Electrical และ CCTV เท่านั้น</p></div></div><section className="surface work-order-surface"><div className="order-list">{(assetRows ?? []).map((asset: any) => <article className="order-row" key={asset.id}><div className="order-main"><span className="order-id">{asset.asset_number}</span><h3>{asset.name || 'Unnamed equipment'}</h3><p>{asset.customers?.name ?? 'ไม่ระบุลูกค้า'} · {asset.customer_sites?.name ?? 'ไม่ระบุ site'}</p></div><div className="order-meta"><span className="status">{asset.system_type}</span><span>{asset.customer_sites?.address || 'ไม่มีที่อยู่'}</span></div></article>)}{!(assetRows ?? []).length && <p className="empty-message">ยังไม่มีข้อมูลอุปกรณ์</p>}</div></section></main>
}
