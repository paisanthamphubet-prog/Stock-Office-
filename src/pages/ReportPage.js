// src/pages/ReportPage.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function ReportPage() {
  const { signOut, profile } = useAuth()
  const [products, setProducts] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*').order('quantity'),
      supabase.from('stock_logs').select('*').order('created_at', { ascending: false }).limit(500)
    ]).then(([pRes, lRes]) => {
      if (pRes.data) setProducts(pRes.data)
      if (lRes.data) setLogs(lRes.data)
      setLoading(false)
    })
  }, [])

  function exportCSV(type) {
    let csv = '', filename = ''
    if (type === 'stock') {
      csv = 'ชื่อสินค้า,หมวดหมู่,จำนวนคงเหลือ,หน่วย,แจ้งเตือนเมื่อต่ำกว่า,สถานะ\n'
      products.forEach(p => {
        const status = p.quantity === 0 ? 'หมดแล้ว' : p.quantity <= p.min_quantity ? 'ใกล้หมด' : 'ปกติ'
        csv += `"${p.name}","${p.category}",${p.quantity},"${p.unit}",${p.min_quantity},"${status}"\n`
      })
      filename = `stock_report_${format(new Date(), 'yyyyMMdd')}.csv`
    } else {
      csv = 'วันที่,สินค้า,ประเภท,จำนวน,ผู้ดำเนินการ,หมายเหตุ\n'
      logs.forEach(l => {
        const d = format(new Date(l.created_at), 'd MMM yyyy HH:mm', { locale: th })
        csv += `"${d}","${l.product_name}","${l.action==='in'?'รับเข้า':'เบิกออก'}",${l.quantity},"${l.user_name||''}","${l.note||''}"\n`
      })
      filename = `log_report_${format(new Date(), 'yyyyMMdd')}.csv`
    }
    const bom = '\ufeff'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
    toast.success('ดาวน์โหลดแล้ว!')
  }

  const totalIn = logs.filter(l => l.action==='in').reduce((s,l) => s+l.quantity, 0)
  const totalOut = logs.filter(l => l.action==='out').reduce((s,l) => s+l.quantity, 0)
  const topUsed = [...logs.filter(l => l.action==='out')].reduce((acc, l) => {
    acc[l.product_name] = (acc[l.product_name]||0) + l.quantity; return acc
  }, {})
  const topList = Object.entries(topUsed).sort((a,b) => b[1]-a[1]).slice(0,5)
  const maxTop = topList[0]?.[1] || 1

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#666' }}>กำลังโหลด...</div>

  return (
    <div style={{ padding:'14px' }}>
      {/* User info */}
      <div style={{ background:'#fff', borderRadius:'14px', border:'0.5px solid #e5e7eb',
        padding:'14px', marginBottom:'14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:'15px', fontWeight:'500', color:'#111' }}>{profile?.display_name}</div>
          <div style={{ fontSize:'12px', color:'#9ca3af' }}>สมาชิก StockOffice</div>
        </div>
        <button onClick={signOut} style={{ padding:'8px 14px', borderRadius:'8px', fontSize:'13px',
          border:'1px solid #e5e7eb', background:'#fff', color:'#374151', cursor:'pointer' }}>
          ออกจากระบบ
        </button>
      </div>

      {/* Export */}
      <div style={{ marginBottom:'14px' }}>
        <div style={{ fontSize:'13px', fontWeight:'500', color:'#9ca3af', marginBottom:'8px' }}>ส่งออกรายงาน CSV</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
          <button onClick={() => exportCSV('stock')}
            style={{ padding:'14px', borderRadius:'12px', border:'1px solid #e5e7eb',
              background:'#fff', cursor:'pointer', textAlign:'center', fontFamily:'inherit' }}>
            <div style={{ fontSize:'22px', marginBottom:'4px' }}>📊</div>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#111' }}>สต็อกปัจจุบัน</div>
            <div style={{ fontSize:'11px', color:'#9ca3af' }}>รายการสินค้าทั้งหมด</div>
          </button>
          <button onClick={() => exportCSV('log')}
            style={{ padding:'14px', borderRadius:'12px', border:'1px solid #e5e7eb',
              background:'#fff', cursor:'pointer', textAlign:'center', fontFamily:'inherit' }}>
            <div style={{ fontSize:'22px', marginBottom:'4px' }}>📋</div>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#111' }}>ประวัติการเคลื่อนไหว</div>
            <div style={{ fontSize:'11px', color:'#9ca3af' }}>500 รายการล่าสุด</div>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ fontSize:'13px', fontWeight:'500', color:'#9ca3af', marginBottom:'8px' }}>สรุปภาพรวม</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
        <div style={{ background:'#EAF3DE', borderRadius:'12px', padding:'14px' }}>
          <div style={{ fontSize:'12px', color:'#3B6D11', marginBottom:'4px' }}>รับเข้าทั้งหมด</div>
          <div style={{ fontSize:'26px', fontWeight:'600', color:'#3B6D11' }}>+{totalIn.toLocaleString()}</div>
          <div style={{ fontSize:'11px', color:'#639922' }}>ชิ้น/หน่วย</div>
        </div>
        <div style={{ background:'#FCEBEB', borderRadius:'12px', padding:'14px' }}>
          <div style={{ fontSize:'12px', color:'#A32D2D', marginBottom:'4px' }}>เบิกออกทั้งหมด</div>
          <div style={{ fontSize:'26px', fontWeight:'600', color:'#A32D2D' }}>-{totalOut.toLocaleString()}</div>
          <div style={{ fontSize:'11px', color:'#E24B4A' }}>ชิ้น/หน่วย</div>
        </div>
      </div>

      {/* Top used */}
      {topList.length > 0 && (
        <>
          <div style={{ fontSize:'13px', fontWeight:'500', color:'#9ca3af', marginBottom:'8px' }}>สินค้าที่ใช้มากสุด</div>
          <div style={{ background:'#fff', borderRadius:'14px', border:'0.5px solid #e5e7eb', padding:'14px' }}>
            {topList.map(([name, qty], i) => (
              <div key={name} style={{ marginBottom: i < topList.length-1 ? '12px' : 0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                  <span style={{ fontSize:'13px', color:'#111' }}>{name}</span>
                  <span style={{ fontSize:'13px', fontWeight:'500', color:'#374151' }}>{qty} หน่วย</span>
                </div>
                <div style={{ height:'6px', background:'#f3f4f6', borderRadius:'3px' }}>
                  <div style={{ width:`${Math.round((qty/maxTop)*100)}%`, height:'100%',
                    background:'#1D9E75', borderRadius:'3px', transition:'width 0.4s' }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
