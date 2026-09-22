'use client'

import { Search, Users, Box, ClipboardList, History, Settings, FileText, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

const workOrders = [
  { id: 'WO-1048', customer: 'ABC Company', equipment: 'CCTV-CAM-012367', issue: 'ภาพจากกล้องไม่แสดงผล', status: 'In Progress', priority: 'High', date: 'วันนี้ 09:42' },
  { id: 'WO-1047', customer: 'Metro Retail', equipment: 'MDB-02', issue: 'เบรกเกอร์ทริป', status: 'Waiting', priority: 'Normal', date: 'วันนี้ 08:18' },
  { id: 'WO-1046', customer: 'Siam Foods', equipment: 'CCTV-NVR-04', issue: 'กล้องวงจรปิด Offline', status: 'New', priority: 'Urgent', date: 'เมื่อวาน' },
  { id: 'WO-1045', customer: 'Northstar Offices', equipment: 'UPS-03', issue: 'ระบบสำรองไฟไม่ทำงาน', status: 'Completed', priority: 'Normal', date: '18 ก.ย. 2026' },
]

const quickLinks = [
  { label: 'Customers', detail: 'ลูกค้าและข้อมูลติดต่อ', icon: Users },
  { label: 'Equipment', detail: 'อุปกรณ์ Electrical และ CCTV', icon: Box },
  { label: 'Work Orders', detail: 'งานซ่อมที่กำลังดำเนินการ', icon: ClipboardList },
  { label: 'History', detail: 'ประวัติการซ่อมถาวร', icon: History },
]

export function MaintenanceHome() {
  const [query, setQuery] = useState('')
  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return workOrders
    return workOrders.filter((order) => Object.values(order).some((value) => value.toLowerCase().includes(normalized)))
  }, [query])

  return (
    <div className="internal-shell">
      <header className="internal-header">
        <div className="brand-mark">maint<span>en</span>ance</div>
        <nav className="top-nav" aria-label="Main navigation">
          <a className="active" href="/">Home</a><a href="/protected">Work Orders</a><a href="/protected">Customers</a><a href="/protected">Equipment</a>
        </nav>
        <div className="user-chip"><span className="avatar">IN</span><span className="user-name">Internal user</span><span className="role-label">STAFF</span></div>
      </header>
      <main className="internal-content">
        <section className="welcome-row"><div><p className="eyebrow">Internal maintenance</p><h1>Home</h1><p className="sub">งานซ่อมระบบ Electrical และ CCTV</p></div><a className="outline-action" href="/protected"><FileText data-icon="inline-start" /> Open work orders</a></section>
        <section className="search-panel" aria-label="Search"><Search data-icon="inline-start" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาลูกค้า อุปกรณ์ หรือเลขที่งานซ่อม" aria-label="Search customer, equipment, or work order" /><kbd>⌘ K</kbd></section>
        <section className="summary-row" aria-label="Operational summary"><div><span className="summary-dot new" /><span>New / waiting</span><strong>8</strong></div><div><span className="summary-dot progress" /><span>In progress</span><strong>4</strong></div><div><span className="summary-dot attention" /><span>ต้องติดตาม</span><strong>2</strong></div></section>
        <div className="home-grid"><section className="surface work-order-surface"><div className="section-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent work orders</h2></div><a href="/protected">View all <ChevronRight data-icon="inline-end" /></a></div><div className="order-list">{filteredOrders.map((order) => <article className="order-row" key={order.id}><div className="order-main"><span className="order-id">{order.id}</span><h3>{order.issue}</h3><p>{order.customer} <span>·</span> {order.equipment}</p></div><div className="order-meta"><span className={`status status-${order.status.toLowerCase().replace(' ', '-')}`}>{order.status}</span><span className={`priority priority-${order.priority.toLowerCase()}`}>{order.priority}</span><time>{order.date}</time></div></article>)}{!filteredOrders.length && <p className="empty-message">ไม่พบงานซ่อมที่ตรงกับคำค้นหา</p>}</div></section><section className="surface quick-surface"><div className="section-heading"><div><p className="eyebrow">Navigate</p><h2>Quick access</h2></div></div><div className="quick-list">{quickLinks.map(({ label, detail, icon: Icon }) => <a href="/protected" className="quick-link" key={label}><span className="quick-icon"><Icon /></span><span><strong>{label}</strong><small>{detail}</small></span><ChevronRight /></a>)}</div></section></div>
      </main>
      <footer className="internal-footer"><span>Maintenance System</span><span>Internal workspace</span><a href="/protected"><Settings data-icon="inline-start" /> System</a></footer>
    </div>
  )
}
