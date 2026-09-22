import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HistoryPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/auth/login')
  const { data: logRows } = await supabase.from('audit_logs').select('id, action, entity, entity_id, before_data, after_data, created_at').order('created_at', { ascending: false }).limit(100)
  return <main className="internal-content"><a className="back-link" href="/">← Home</a><div className="welcome-row"><div><p className="eyebrow">Audit trail</p><h1>Maintenance history</h1><p className="sub">ประวัติการเปลี่ยนแปลงจากระบบจริง</p></div></div><section className="surface work-order-surface"><div className="order-list">{(logRows ?? []).map((log: any) => <article className="order-row" key={log.id}><div className="order-main"><span className="order-id">{log.entity_id || 'SYSTEM'}</span><h3>{log.action.replaceAll('_', ' ')}</h3><p>{log.entity}</p></div><div className="order-meta"><span>{log.before_data?.status ? `${log.before_data.status} → ` : ''}{log.after_data?.status || 'recorded'}</span><time>{new Date(log.created_at).toLocaleString('th-TH')}</time></div></article>)}{!(logRows ?? []).length && <p className="empty-message">ยังไม่มีประวัติ</p>}</div></section></main>
}
