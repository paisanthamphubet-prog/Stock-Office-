// src/App.js
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './lib/AuthContext'
import LoginPage from './pages/LoginPage'
import StockPage from './pages/StockPage'
import LogPage from './pages/LogPage'
import ReportPage from './pages/ReportPage'

function AppInner() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('stock')

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      flexDirection:'column', gap:'12px', background:'#f4f6f8' }}>
      <div style={{ fontSize:'36px' }}>📦</div>
      <div style={{ fontSize:'15px', color:'#9ca3af' }}>กำลังโหลด StockOffice...</div>
    </div>
  )

  if (!user) return <LoginPage />

  const tabs = [
    { key:'stock',  label:'สต็อก',   icon:'📦' },
    { key:'log',    label:'ประวัติ',  icon:'🕐' },
    { key:'report', label:'รายงาน',  icon:'📊' },
  ]

  return (
    <div style={{ maxWidth:'480px', margin:'0 auto', background:'#f4f6f8',
      minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ background:'#fff', padding:'14px 16px 10px',
        borderBottom:'1px solid #f3f4f6', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 style={{ fontSize:'18px', fontWeight:'700', margin:0, color:'#111' }}>
            📦 StockOffice
          </h1>
          <div style={{ fontSize:'12px', color:'#9ca3af' }}>
            {tabs.find(t => t.key === tab)?.label}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', paddingBottom:'70px' }}>
        {tab === 'stock'  && <StockPage />}
        {tab === 'log'    && <LogPage />}
        {tab === 'report' && <ReportPage />}
      </div>

      {/* Bottom Nav */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:'480px', background:'#fff',
        borderTop:'1px solid #f3f4f6', display:'flex', zIndex:50 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex:1, padding:'10px 0 12px', border:'none', background:'none',
              cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
              transition:'opacity 0.15s', opacity: tab===t.key ? 1 : 0.45 }}>
            <span style={{ fontSize:'22px' }}>{t.icon}</span>
            <span style={{ fontSize:'11px', fontWeight: tab===t.key ? '600' : '400',
              color: tab===t.key ? '#1D9E75' : '#9ca3af' }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" toastOptions={{ duration: 2500,
        style: { borderRadius:'12px', fontSize:'14px', fontFamily:'sans-serif' } }} />
      <AppInner />
    </AuthProvider>
  )
}
