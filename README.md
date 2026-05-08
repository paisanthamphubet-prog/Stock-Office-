# 📦 StockOffice

ระบบจัดการสต็อกของสำนักงาน — React PWA + Supabase

## ติดตั้งบนมือถือ (PWA)

**iPhone:**
Safari → เปิด URL → Share → "Add to Home Screen"

**Android:**
Chrome → เปิด URL → Menu → "Add to Home Screen" / "Install App"

---

## ฟีเจอร์

- ✅ Login / Register (หลาย user)
- ✅ เพิ่ม/แก้ไข/ลบสินค้า
- ✅ รับสินค้าเข้า / เบิกออก
- ✅ Real-time sync (ทุกคนเห็นพร้อมกัน)
- ✅ แจ้งเตือน stock ต่ำ
- ✅ ประวัติการเคลื่อนไหว (Log)
- ✅ Export CSV (สต็อก + ประวัติ)
- ✅ ใช้งานบนมือถือได้ (PWA)

---

## โครงสร้างไฟล์

```
src/
  lib/
    supabase.js       ← Supabase client
    AuthContext.js    ← ระบบ login
  pages/
    LoginPage.js      ← หน้า login/register
    StockPage.js      ← หน้าหลัก สต็อก
    LogPage.js        ← ประวัติการเคลื่อนไหว
    ReportPage.js     ← รายงาน + export
  App.js              ← root + bottom navigation
```
