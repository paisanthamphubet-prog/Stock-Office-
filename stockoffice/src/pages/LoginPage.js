// src/pages/LoginPage.js
import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } else {
      if (!displayName.trim()) { toast.error('กรุณาใส่ชื่อผู้ใช้'); setLoading(false); return }
      const { error } = await signUp(email, password, displayName)
      if (error) toast.error(error.message)
      else toast.success('สมัครสำเร็จ! กรุณาตรวจสอบอีเมล')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#f4f6f8', padding:'20px' }}>
      <div style={{ width:'100%', maxWidth:'380px' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ fontSize:'36px', marginBottom:'8px' }}>📦</div>
          <h1 style={{ fontSize:'22px', fontWeight:'600', color:'#111', margin:'0 0 4px' }}>StockOffice</h1>
          <p style={{ fontSize:'14px', color:'#666', margin:0 }}>ระบบจัดการสต็อกสำนักงาน</p>
        </div>

        <div style={{ background:'#fff', borderRadius:'16px', padding:'28px 24px',
          border:'1px solid #e5e7eb' }}>
          <div style={{ display:'flex', gap:'4px', background:'#f3f4f6', borderRadius:'10px',
            padding:'4px', marginBottom:'24px' }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex:1, padding:'8px', borderRadius:'8px', border:'none', fontSize:'14px',
                  fontWeight:'500', cursor:'pointer', transition:'all 0.15s',
                  background: mode===m ? '#fff' : 'transparent',
                  color: mode===m ? '#111' : '#666',
                  boxShadow: mode===m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                {m === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div style={{ marginBottom:'14px' }}>
                <label style={labelStyle}>ชื่อผู้ใช้ (แสดงใน log)</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="เช่น สมชาย, มาลี" style={inputStyle} />
              </div>
            )}
            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>อีเมล</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" style={inputStyle} required />
            </div>
            <div style={{ marginBottom:'20px' }}>
              <label style={labelStyle}>รหัสผ่าน</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร" style={inputStyle} required minLength={6} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'12px', borderRadius:'10px', border:'none',
                background: loading ? '#9ca3af' : '#1D9E75', color:'#fff', fontSize:'15px',
                fontWeight:'600', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'กำลังดำเนินการ...' : (mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display:'block', fontSize:'13px', fontWeight:'500', color:'#374151', marginBottom:'6px' }
const inputStyle = {
  width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #d1d5db',
  fontSize:'14px', outline:'none', boxSizing:'border-box',
  fontFamily:'inherit', color:'#111'
}
