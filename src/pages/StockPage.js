// src/pages/StockPage.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import toast from 'react-hot-toast'

export default function StockPage() {
  const { profile } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // { type: 'add'|'edit'|'move', product? }
  const [form, setForm] = useState({})
  const [moveQty, setMoveQty] = useState(1)
  const [moveNote, setMoveNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').order('name')
    if (!error) setProducts(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts()
    // Real-time subscription
    const channel = supabase.channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchProducts])

  async function handleMove(product, action) {
    setModal({ type: 'move', product, action })
    setMoveQty(1)
    setMoveNote('')
  }

  async function submitMove() {
    const { product, action } = modal
    if (action === 'out' && moveQty > product.quantity) {
      toast.error('จำนวนเกิน Stock ที่มีอยู่'); return
    }
    setSubmitting(true)
    const newQty = action === 'in' ? product.quantity + moveQty : product.quantity - moveQty
    const { error: updateErr } = await supabase.from('products')
      .update({ quantity: newQty }).eq('id', product.id)
    if (updateErr) { toast.error('เกิดข้อผิดพลาด'); setSubmitting(false); return }
    await supabase.from('stock_logs').insert({
      product_id: product.id, product_name: product.name,
      action, quantity: moveQty, note: moveNote,
      user_name: profile?.display_name || 'ไม่ระบุ', user_id: profile?.id
    })
    toast.success(action === 'in' ? `รับเข้า ${moveQty} ${product.unit}` : `เบิกออก ${moveQty} ${product.unit}`)
    setModal(null); setSubmitting(false); fetchProducts()
  }

  async function handleSaveProduct() {
    if (!form.name?.trim()) { toast.error('กรุณาใส่ชื่อสินค้า'); return }
    setSubmitting(true)
    if (modal.type === 'add') {
      const { error } = await supabase.from('products').insert({
        name: form.name, category: form.category || 'ทั่วไป',
        unit: form.unit || 'ชิ้น',
        quantity: parseInt(form.quantity) || 0,
        min_quantity: parseInt(form.min_quantity) || 5,
        created_by: profile?.id
      })
      if (!error) toast.success('เพิ่มสินค้าแล้ว')
      else toast.error('เกิดข้อผิดพลาด')
    } else {
      const { error } = await supabase.from('products').update({
        name: form.name, category: form.category,
        unit: form.unit, min_quantity: parseInt(form.min_quantity)
      }).eq('id', modal.product.id)
      if (!error) toast.success('แก้ไขแล้ว')
      else toast.error('เกิดข้อผิดพลาด')
    }
    setModal(null); setSubmitting(false); fetchProducts()
  }

  async function handleDelete(product) {
    if (!window.confirm(`ลบ "${product.name}" ออกจากระบบ?`)) return
    await supabase.from('products').delete().eq('id', product.id)
    toast.success('ลบสินค้าแล้ว'); fetchProducts()
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )
  const lowStock = products.filter(p => p.quantity <= p.min_quantity && p.quantity > 0).length
  const outStock = products.filter(p => p.quantity === 0).length

  function getStatus(p) {
    if (p.quantity === 0) return 'out'
    if (p.quantity <= p.min_quantity) return 'low'
    return 'ok'
  }

  const statusConfig = {
    ok:  { label:'ปกติ',    bg:'#EAF3DE', color:'#3B6D11', barColor:'#639922' },
    low: { label:'ใกล้หมด', bg:'#FAEEDA', color:'#854F0B', barColor:'#EF9F27' },
    out: { label:'หมดแล้ว', bg:'#FCEBEB', color:'#A32D2D', barColor:'#E24B4A' },
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#666' }}>กำลังโหลด...</div>

  return (
    <div style={{ padding:'14px' }}>
      {(lowStock > 0 || outStock > 0) && (
        <div style={{ background:'#FAEEDA', border:'0.5px solid #EF9F27', borderRadius:'10px',
          padding:'10px 14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'18px' }}>⚠️</span>
          <span style={{ fontSize:'13px', color:'#633806', fontWeight:'500' }}>
            {outStock > 0 && `${outStock} รายการหมดแล้ว`}
            {outStock > 0 && lowStock > 0 && ' · '}
            {lowStock > 0 && `${lowStock} รายการใกล้หมด`}
          </span>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
        <StatCard label="ทั้งหมด" value={products.length} sub="ประเภทสินค้า" />
        <StatCard label="ต้องสั่งซื้อ" value={lowStock + outStock} sub="รายการ" color="#BA7517" />
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍  ค้นหาสินค้า..." style={{ width:'100%', padding:'10px 14px',
          borderRadius:'10px', border:'1px solid #e5e7eb', fontSize:'14px',
          marginBottom:'14px', boxSizing:'border-box', fontFamily:'inherit' }} />

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', color:'#9ca3af', padding:'40px 0' }}>ไม่พบสินค้า</div>
      )}

      {filtered.map(p => {
        const st = getStatus(p)
        const cfg = statusConfig[st]
        const barPct = p.quantity === 0 ? 0 : Math.min(100, Math.round((p.quantity / (p.min_quantity * 5)) * 100))
        return (
          <div key={p.id} style={{ background:'#fff', borderRadius:'14px',
            border:'0.5px solid #e5e7eb', marginBottom:'10px', overflow:'hidden' }}>
            <div style={{ padding:'12px 14px 8px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:'15px', fontWeight:'500', color:'#111' }}>{p.name}</div>
                <div style={{ fontSize:'12px', color:'#9ca3af', marginTop:'2px' }}>{p.category}</div>
              </div>
              <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                <span style={{ background:cfg.bg, color:cfg.color, fontSize:'11px',
                  padding:'3px 9px', borderRadius:'20px', fontWeight:'500' }}>{cfg.label}</span>
                <button onClick={() => { setModal({ type:'edit', product:p }); setForm(p) }}
                  style={iconBtn}>✏️</button>
                <button onClick={() => handleDelete(p)} style={iconBtn}>🗑️</button>
              </div>
            </div>
            <div style={{ padding:'0 14px 12px', display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ flex:1, height:'6px', background:'#f3f4f6', borderRadius:'3px', overflow:'hidden' }}>
                <div style={{ width:`${barPct}%`, height:'100%', background:cfg.barColor, borderRadius:'3px', transition:'width 0.3s' }} />
              </div>
              <span style={{ fontSize:'13px', fontWeight:'500', minWidth:'70px', textAlign:'right', color: st==='out' ? '#A32D2D' : '#111' }}>
                {p.quantity} {p.unit}
              </span>
            </div>
            <div style={{ borderTop:'0.5px solid #f3f4f6', padding:'8px 14px', display:'flex', gap:'8px' }}>
              <button onClick={() => handleMove(p, 'in')} style={{ ...actionBtn, background:'#E1F5EE', borderColor:'#5DCAA5', color:'#0F6E56' }}>
                ＋ รับเข้า
              </button>
              <button onClick={() => handleMove(p, 'out')} disabled={p.quantity === 0}
                style={{ ...actionBtn, background: p.quantity===0 ? '#f9fafb' : '#FCEBEB',
                  borderColor: p.quantity===0 ? '#e5e7eb' : '#F09595',
                  color: p.quantity===0 ? '#d1d5db' : '#A32D2D',
                  cursor: p.quantity===0 ? 'not-allowed' : 'pointer' }}>
                － เบิกใช้
              </button>
            </div>
          </div>
        )
      })}

      <button onClick={() => { setModal({ type:'add' }); setForm({ unit:'ชิ้น', min_quantity:'5' }) }}
        style={{ position:'fixed', bottom:'80px', right:'20px', width:'52px', height:'52px',
          borderRadius:'50%', background:'#1D9E75', border:'none', color:'#fff',
          fontSize:'26px', cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.2)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>＋</button>

      {/* Modal: รับเข้า/เบิกออก */}
      {modal?.type === 'move' && (
        <Modal title={modal.action === 'in' ? `รับเข้า: ${modal.product.name}` : `เบิกใช้: ${modal.product.name}`}
          onClose={() => setModal(null)}>
          <label style={lbl}>จำนวน ({modal.product.unit})</label>
          <input type="number" min="1" max={modal.action==='out' ? modal.product.quantity : 9999}
            value={moveQty} onChange={e => setMoveQty(parseInt(e.target.value)||1)} style={inp} />
          {modal.action === 'out' && (
            <p style={{ fontSize:'12px', color:'#9ca3af', margin:'-8px 0 12px' }}>
              คงเหลือ: {modal.product.quantity} {modal.product.unit}
            </p>
          )}
          <label style={lbl}>หมายเหตุ (ไม่บังคับ)</label>
          <input value={moveNote} onChange={e => setMoveNote(e.target.value)}
            placeholder="เช่น สั่งจากซัพพลายเออร์, ใช้ในการประชุม" style={inp} />
          <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
            <button onClick={() => setModal(null)} style={btnSecondary}>ยกเลิก</button>
            <button onClick={submitMove} disabled={submitting}
              style={{ ...btnPrimary, background: modal.action==='in' ? '#1D9E75' : '#E24B4A' }}>
              {submitting ? 'กำลังบันทึก...' : (modal.action==='in' ? 'ยืนยันรับเข้า' : 'ยืนยันเบิก')}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: เพิ่ม/แก้ไขสินค้า */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <Modal title={modal.type === 'add' ? 'เพิ่มสินค้าใหม่' : 'แก้ไขสินค้า'}
          onClose={() => setModal(null)}>
          {[
            { label:'ชื่อสินค้า *', key:'name', placeholder:'เช่น กระดาษ A4' },
            { label:'หมวดหมู่', key:'category', placeholder:'เช่น เครื่องเขียน' },
            { label:'หน่วยนับ', key:'unit', placeholder:'เช่น ชิ้น, รีม, กล่อง' },
            ...(modal.type==='add' ? [{ label:'จำนวนเริ่มต้น', key:'quantity', type:'number', placeholder:'0' }] : []),
            { label:'แจ้งเตือนเมื่อเหลือน้อยกว่า', key:'min_quantity', type:'number', placeholder:'5' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:'12px' }}>
              <label style={lbl}>{f.label}</label>
              <input type={f.type||'text'} value={form[f.key]||''} placeholder={f.placeholder}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={inp} />
            </div>
          ))}
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={() => setModal(null)} style={btnSecondary}>ยกเลิก</button>
            <button onClick={handleSaveProduct} disabled={submitting} style={btnPrimary}>
              {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background:'#f9fafb', borderRadius:'12px', padding:'12px' }}>
      <div style={{ fontSize:'12px', color:'#9ca3af', marginBottom:'4px' }}>{label}</div>
      <div style={{ fontSize:'24px', fontWeight:'600', color: color||'#111' }}>{value}</div>
      <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'2px' }}>{sub}</div>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200,
      display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px 32px',
        width:'100%', maxWidth:'480px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h3 style={{ fontSize:'17px', fontWeight:'600', margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'22px',
            cursor:'pointer', color:'#9ca3af', lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const lbl = { display:'block', fontSize:'13px', fontWeight:'500', color:'#374151', marginBottom:'6px' }
const inp = { width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #d1d5db',
  fontSize:'14px', boxSizing:'border-box', fontFamily:'inherit', marginBottom:'12px' }
const actionBtn = { flex:1, padding:'8px 0', fontSize:'13px', borderRadius:'8px',
  border:'0.5px solid', cursor:'pointer', fontFamily:'inherit' }
const btnPrimary = { flex:1, padding:'11px', borderRadius:'10px', border:'none',
  background:'#1D9E75', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer' }
const btnSecondary = { flex:1, padding:'11px', borderRadius:'10px',
  border:'1px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:'14px', cursor:'pointer' }
const iconBtn = { background:'none', border:'none', cursor:'pointer', fontSize:'14px', padding:'2px 4px' }
