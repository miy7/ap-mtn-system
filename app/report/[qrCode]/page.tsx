'use client'

import { FormEvent, useEffect, useState } from 'react'
import { CheckCircle2, ClipboardList, Loader2, MapPin, ShieldCheck } from 'lucide-react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Site = { id: string; name: string; address: string | null; customer: { name: string } | null }
type Result = { request_number: string }

export default function ReportPage() {
  const { qrCode } = useParams<{ qrCode: string }>()
  const [site, setSite] = useState<Site | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState<Result | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('qr_codes').select('site_id, customer_sites!inner(id, name, address, customers(name))').eq('code', qrCode).eq('active', true).maybeSingle()
      if (!cancelled) {
        const row = data as { customer_sites: Site } | null
        setSite(row?.customer_sites ?? null)
        setLoading(false)
      }
    }
    if (qrCode) load()
    return () => { cancelled = true }
  }, [qrCode])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/maintenance-requests', { method: 'POST', body: JSON.stringify({ qrCode, siteId: site?.id, assetNumber: form.get('assetNumber'), problem: form.get('problem'), contactName: form.get('contactName'), phone: form.get('phone'), priority: form.get('priority') }), headers: { 'Content-Type': 'application/json' } })
    const body = await response.json()
    if (!response.ok) { setError(body.error?.message ?? 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่'); return }
    setSubmitted(body.data)
  }

  if (loading) return <main className="report-page"><Loader2 className="spin" /> กำลังโหลดข้อมูลสถานที่...</main>
  if (!site) return <main className="report-page"><div className="report-card"><ClipboardList size={28} /><h1>ไม่พบ QR Code</h1><p>QR Code นี้อาจถูกปิดใช้งานหรือไม่ถูกต้อง กรุณาติดต่อทีมงาน</p></div></main>
  if (submitted) return <main className="report-page"><div className="report-card success"><CheckCircle2 size={48} /><div className="eyebrow">รับแจ้งปัญหาแล้ว</div><h1>ทีมงานได้รับข้อมูลของคุณแล้ว</h1>{submitted.request_number && <p>เลขที่คำขอ <strong>{submitted.request_number}</strong></p>}<p>เราจะติดต่อกลับตามข้อมูลที่ให้ไว้</p></div></main>

  return <main className="report-page"><div className="report-card"><div className="report-brand">maint<span>en</span>ance</div><div className="eyebrow">แจ้งปัญหาการใช้งาน</div><h1>แจ้งซ่อมอุปกรณ์</h1><div className="site-banner"><MapPin size={18} /><div><strong>{site.customer?.name ?? 'Customer site'}</strong><span>{site.name}{site.address ? ` · ${site.address}` : ''}</span></div></div><form onSubmit={submit} className="report-form"><label>เลขอุปกรณ์<input required name="assetNumber" placeholder="เช่น CAM-042" /></label><label>รายละเอียดปัญหา<textarea required name="problem" placeholder="อธิบายอาการหรือปัญหาที่พบ" rows={4} /></label><div className="form-grid"><label>ชื่อผู้ติดต่อ<input required name="contactName" placeholder="ชื่อ-นามสกุล" /></label><label>เบอร์โทรศัพท์<input required name="phone" type="tel" placeholder="08x-xxx-xxxx" /></label></div><label>ความเร่งด่วน<select name="priority" defaultValue="NORMAL"><option value="LOW">ต่ำ</option><option value="NORMAL">ปกติ</option><option value="HIGH">สูง</option><option value="URGENT">เร่งด่วน</option></select></label>{error && <p className="form-error">{error}</p>}<button className="btn primary submit-btn" type="submit">ส่งคำขอแจ้งซ่อม</button></form><div className="privacy"><ShieldCheck size={16} /> ข้อมูลนี้จะถูกส่งให้ทีมงานดูแลระบบเท่านั้น</div></div></main>
}

