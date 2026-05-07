# 📦 StockOffice

ระบบจัดการสต็อกของสำนักงาน — React PWA + Supabase

---

## ขั้นตอนติดตั้ง

### 1. สร้าง Supabase Project (ฟรี)

1. ไปที่ https://supabase.com → Sign up / Login
2. กด **New Project** → ตั้งชื่อ (เช่น `stockoffice`) → ตั้ง password → เลือก region: **Southeast Asia (Singapore)**
3. รอสัก 1-2 นาที

### 2. รัน SQL Schema

1. ใน Supabase Dashboard → **SQL Editor** → **New query**
2. เปิดไฟล์ `supabase_schema.sql` ในโปรเจกต์นี้
3. Copy ทั้งหมด → Paste → กด **Run**
4. ถ้าขึ้น "Success" แสดงว่าสำเร็จ

### 3. คัดลอก API Keys

1. Supabase Dashboard → **Settings** → **API**
2. คัดลอก:
   - **Project URL** (เช่น `https://abcdefgh.supabase.co`)
   - **anon public** key (ขึ้นต้นด้วย `eyJhbGci...`)

### 4. สร้างไฟล์ .env

```bash
# ในโฟลเดอร์โปรเจกต์ สร้างไฟล์ .env
cp .env.example .env
```

แก้ไขไฟล์ `.env`:
```
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. รัน App

```bash
npm install
npm start
```

เปิดเบราว์เซอร์ไปที่ http://localhost:3000

---

## Deploy ขึ้น Internet (ฟรี)

แนะนำใช้ **Vercel** (ฟรี, รวดเร็ว):

```bash
npm install -g vercel
vercel
```

หรือ **Netlify**:
```bash
npm run build
# ลาก folder `build/` ไปที่ https://app.netlify.com/drop
```

อย่าลืมเพิ่ม environment variables ใน Vercel/Netlify dashboard ด้วย:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

---

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
