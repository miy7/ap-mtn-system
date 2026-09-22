'use client'

import { Search, Users, Box, ClipboardList, History, FileText, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

type HomeOrder = { id: string; customer: string; equipment: string; issue: string; status: string; priority: string; date: string }

export function MaintenanceHome({ orders }: { orders: HomeOrder[] }) {
  const [query, setQuery] = useState('')
  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return normalized ? orders.filter((order) => Object.values(order).some((value) => value.toLowerCase().includes(normalized))) : orders
  }, [orders, query])
  const quickLinks = [
    { label: 'Customers', detail: 'ลูกค้าและข้อมูลติดต่อ', icon: Users, href: '/protected/customers' },
    { label: 'Equipment', detail: 'อุปกรณ์ Electrical และ CCTV', icon: Box, href: '/protected/equipment' },
    { label: 'Work Orders', detail: 'งานซ่อมที่กำลังดำเนินการ', icon: ClipboardList, href: '/protected/work-orders' },
    { label: 'History', detail: 'ประวัติการซ่อมถาวร', icon: History, href: '/protected/history' },
  ]
  return <div className="internal-shell"><header className="internal-header"><a className="brand-mark" href="/">maint<span>en</span>ance</a><nav className="top-nav" aria-label="Main navigation"><a className="active" href="/">Home</a><a href="/protected/work-orders">Work Orders</a><a href="/protected/customers">Customers</a><a href="/protected/equipment">Equipment</a></nav><div className="user-chip"><span className="role-label">STAFF</span></div></header><main className="internal-content"><section className="welcome-row"><div><p className="eyebrow">Internal maintenance</p><h1>Home</h1><p className="sub">งานซ่อมระบบ Electrical และ CCTV</p></div><a className="outline-action" href="/protected/work-orders"><FileText data-icon="inline-start" /> Open work orders</a></section><section className="search-panel" aria-label="Search"><Search data-icon="inline-start" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาลูกค้า อุปกรณ์ หรือเลขที่งานซ่อม" aria-label="Search customer, equipment, or work order" /></section><section className="summary-row" aria-label="Operational summary"><div><span>Recent work orders</span><strong>{orders.length}</strong></div><div><span>In progress</span><strong>{orders.filter((order) => order.status === 'IN_PROGRESS').length}</strong></div><div><span>Waiting</span><strong>{orders.filter((order) => order.status.includes('WAITING')).length}</strong></div></section><div className="home-grid"><section className="surface work-order-surface"><div className="section-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent work orders</h2></div><a href="/protected/work-orders">View all <ChevronRight data-icon="inline-end" /></a></div><div className="order-list">{filteredOrders.map((order) => <article className="order-row" key={order.id}><div className="order-main"><span className="order-id">{order.id}</span><h3>{order.issue}</h3><p>{order.customer} <span>·</span> {order.equipment}</p></div><div className="order-meta"><span className="status">{order.status.replaceAll('_', ' ')}</span><span className="priority">{order.priority}</span><time>{order.date}</time></div></article>)}{!filteredOrders.length && <p className="empty-message">ไม่พบงานซ่อม</p>}</div></section><section className="surface quick-surface"><div className="section-heading"><div><p className="eyebrow">Navigate</p><h2>Quick access</h2></div></div><div className="quick-list">{quickLinks.map(({ label, detail, icon: Icon, href }) => <a href={href} className="quick-link" key={label}><span className="quick-icon"><Icon /></span><span><strong>{label}</strong><small>{detail}</small></span><ChevronRight /></a>)}</div></section></div></main></div>
}
