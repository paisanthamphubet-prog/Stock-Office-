// src/pages/ApprovePage.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function ApprovePage() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [submitting, setSubmitting] = useState(null)

  useEffect(() => {
    fetchRequests()
    const channel = supabase.channel('requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_requests' }, fetchRequests)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchRequests() {
    const { data } = await supabase.from('stock_requests')
      .select('*, products(image_url, unit)')
      .order('created_at', { ascending: false })
    if (data) setRequests(data)
    setLoading(false)
  }

  async function handleApprove(req) {
    setSubmitting(req.id)
    // ลด stock
    const { data: product } = await supabase.from('products').select('quantity').eq('id', req.product_id).single()
    if (!product) { toast.error('ไม่พบสินค้า'); setSubmitting(null); return }
    if (product.quantity < req.quantity) { toast.error('Stock ไม่พอแล้ว'); setSubmitting(null); return }

    await supabase.from('products').update({ quantity: product.quantity - req.quantity }).eq('id', req.product_id)
    await supabase.from('stock_logs').insert({
      product_id: req.product_id, product_name: req.product_name,
      action: 'out', quantity: req.quantity,
      note: `อนุมัติจากคำขอของ ${req.requester_name}${req.note ? ` — ${req.note}` : ''}`,
      user_name: profile?.display_name, user_id: profile?.id
    })
    await supabase.from('stock_requests').update({
      status: 'approved', approved_by: profile?.id, approver_name: profile?.display_name,
      updated_at: new Date().toISOString()
    }).eq('id', req.id)

    toast.success(`อนุมัติ ${req.product_name} ${req.quantity} ชิ้นแล้ว`)
    setSubmitting(null); fetchRequests()
  }

  async function handleReject(req) {
    setSubmitting(req.id + '-reject')
    await supabase.from('stock_requests').update({
      status: 'rejected', approved_by: profile?.id, approver_name: profile?.display_name,
      updated_at: new Date().toISOString()
    }).eq('id', req.id)
    toast.success('ปฏิเสธคำขอแล้ว')
    setSubmitting(null); fetchRequests()
  }

  const filtered = requests.filter(r => filter === 'all' || r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  function formatDate(d) {
    try { return format(new Date(d), 'd MMM HH:mm', { locale: th }) } catch { return d }
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#666' }}>กำลังโหลด...</div>

  return (
    <div style={{ padding:'14px' }}>
      {pendingCount > 0 && (
        <div style={{ background:'#FAEEDA', border:'0.5px solid #EF9F27', borderRadius:'10px',
          padding:'10px 14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
          <span>⏳</span>
          <span style={{ fontSize:'13px', color:'#633806', fontWeight:'500' }}>
            มีคำขอรออนุมัติ {pendingCount} รายการ
          </span>
        </div>
      )}

      <div style={{ display:'flex', gap:'6px', marginBottom:'14px' }}>
        {[
          { key:'pending',  label:'รออนุมัติ', count: requests.filter(r=>r.status==='pending').length },
          { key:'approved', label:'อนุมัติแล้ว' },
          { key:'rejected', label:'ปฏิเสธ' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ flex:1, padding:'8px 4px', borderRadius:'10px', border:'1px solid',
              fontSize:'12px', fontWeight:'500', cursor:'pointer', fontFamily:'inherit',
              background: filter===f.key ? (f.key==='pending'?'#FAEEDA':f.key==='approved'?'#EAF3DE':'#FCEBEB') : '#fff',
              borderColor: filter===f.key ? (f.key==='pending'?'#EF9F27':f.key==='approved'?'#97C459':'#F09595') : '#e5e7eb',
              color: filter===f.key ? (f.key==='pending'?'#854F0B':f.key==='approved'?'#3B6D11':'#A32D2D') : '#9ca3af' }}>
            {f.label}{f.count > 0 ? ` (${f.count})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', color:'#9ca3af', padding:'60px 0' }}>ไม่มีคำขอ</div>
      )}

      {filtered.map(req => (
        <div key={req.id} style={{ background:'#fff', borderRadius:'14px', border:'0.5px solid #e5e7eb', marginBottom:'10px', overflow:'hidden' }}>
          <div style={{ padding:'14px', display:'flex', gap:'12px', alignItems:'flex-start' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'10px', flexShrink:0,
              background:'#f3f4f6', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {req.products?.image_url
                ? <img src={req.products.image_url} alt={req.product_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontSize:'22px' }}>📦</span>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ fontSize:'15px', fontWeight:'500', color:'#111' }}>{req.product_name}</div>
                <StatusBadge status={req.status} />
              </div>
              <div style={{ fontSize:'13px', color:'#374151', margin:'4px 0' }}>
                จำนวน: <strong>{req.quantity} {req.products?.unit || 'ชิ้น'}</strong>
              </div>
              <div style={{ fontSize:'12px', color:'#9ca3af' }}>
                ขอโดย {req.requester_name} · {formatDate(req.created_at)}
              </div>
              {req.note && (
                <div style={{ fontSize:'12px', color:'#374151', marginTop:'4px',
                  background:'#f9fafb', borderRadius:'6px', padding:'6px 8px' }}>
                  💬 {req.note}
                </div>
              )}
              {req.status !== 'pending' && req.approver_name && (
                <div style={{ fontSize:'12px', color:'#9ca3af', marginTop:'4px' }}>
                  {req.status === 'approved' ? '✅' : '❌'} โดย {req.approver_name} · {formatDate(req.updated_at)}
                </div>
              )}
            </div>
          </div>

          {req.status === 'pending' && (
            <div style={{ borderTop:'0.5px solid #f3f4f6', padding:'10px 14px', display:'flex', gap:'8px' }}>
              <button onClick={() => handleReject(req)} disabled={!!submitting}
                style={{ flex:1, padding:'9px', borderRadius:'10px', border:'1px solid #e5e7eb',
                  background:'#fff', color:'#374151', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
                {submitting === req.id+'-reject' ? 'กำลังดำเนินการ...' : '❌ ปฏิเสธ'}
              </button>
              <button onClick={() => handleApprove(req)} disabled={!!submitting}
                style={{ flex:1, padding:'9px', borderRadius:'10px', border:'none',
                  background:'#1D9E75', color:'#fff', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
                {submitting === req.id ? 'กำลังอนุมัติ...' : '✅ อนุมัติ'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    pending:  { label:'รออนุมัติ', bg:'#FAEEDA', color:'#854F0B' },
    approved: { label:'อนุมัติแล้ว', bg:'#EAF3DE', color:'#3B6D11' },
    rejected: { label:'ปฏิเสธ', bg:'#FCEBEB', color:'#A32D2D' },
  }
  const c = config[status] || config.pending
  return <span style={{ background:c.bg, color:c.color, fontSize:'11px', padding:'3px 9px', borderRadius:'20px', fontWeight:'500', whiteSpace:'nowrap' }}>{c.label}</span>
}
