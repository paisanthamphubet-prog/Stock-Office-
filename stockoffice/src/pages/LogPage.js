// src/pages/LogPage.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export default function LogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | in | out

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    const { data } = await supabase.from('stock_logs')
      .select('*').order('created_at', { ascending: false }).limit(100)
    if (data) setLogs(data)
    setLoading(false)
  }

  const filtered = logs.filter(l => filter === 'all' || l.action === filter)

  function formatDate(dateStr) {
    try {
      return format(new Date(dateStr), 'd MMM HH:mm', { locale: th })
    } catch { return dateStr }
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#666' }}>กำลังโหลด...</div>

  return (
    <div style={{ padding:'14px' }}>
      <div style={{ display:'flex', gap:'6px', marginBottom:'14px' }}>
        {[
          { key:'all', label:'ทั้งหมด' },
          { key:'in',  label:'รับเข้า' },
          { key:'out', label:'เบิกออก' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ flex:1, padding:'8px', borderRadius:'10px', border:'1px solid',
              fontSize:'13px', fontWeight:'500', cursor:'pointer',
              background: filter===f.key ? (f.key==='in' ? '#EAF3DE' : f.key==='out' ? '#FCEBEB' : '#E1F5EE') : '#fff',
              borderColor: filter===f.key ? (f.key==='in' ? '#97C459' : f.key==='out' ? '#F09595' : '#5DCAA5') : '#e5e7eb',
              color: filter===f.key ? (f.key==='in' ? '#3B6D11' : f.key==='out' ? '#A32D2D' : '#0F6E56') : '#9ca3af',
              fontFamily:'inherit' }}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', color:'#9ca3af', padding:'60px 0' }}>ยังไม่มีประวัติ</div>
      )}

      <div style={{ background:'#fff', borderRadius:'14px', border:'0.5px solid #e5e7eb', overflow:'hidden' }}>
        {filtered.map((log, i) => (
          <div key={log.id} style={{ display:'flex', alignItems:'center', gap:'12px',
            padding:'12px 14px', borderBottom: i < filtered.length-1 ? '0.5px solid #f3f4f6' : 'none' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'50%', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px',
              background: log.action==='in' ? '#EAF3DE' : '#FCEBEB' }}>
              {log.action === 'in' ? '↙' : '↗'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'14px', fontWeight:'500', color:'#111',
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {log.product_name}
              </div>
              <div style={{ fontSize:'12px', color:'#9ca3af', marginTop:'2px' }}>
                {log.user_name} · {formatDate(log.created_at)}
                {log.note && <span> · {log.note}</span>}
              </div>
            </div>
            <span style={{ fontSize:'15px', fontWeight:'600', flexShrink:0,
              color: log.action==='in' ? '#3B6D11' : '#A32D2D' }}>
              {log.action==='in' ? '+' : '-'}{log.quantity}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
