'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInError) {
      setError(signInError.code === 'invalid_credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่')
      return
    }
    router.replace('/protected')
    router.refresh()
  }

  return <main className="report-page"><div className="report-card"><div className="report-brand">maint<span>en</span>ance</div><div className="eyebrow">Internal workspace</div><h1>เข้าสู่ระบบทีมงาน</h1><form onSubmit={submit} className="report-form"><label>อีเมล<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>รหัสผ่าน<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="form-error">{error}</p>}<button className="btn primary submit-btn" disabled={loading}>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button></form></div></main>
}
