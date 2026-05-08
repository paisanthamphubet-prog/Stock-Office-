# 🔧 StockOffice v2 — คู่มือ Setup เพิ่มเติม

## ขั้นตอนที่ 1 — รัน SQL Update

ไปที่ Supabase → SQL Editor → New query → วางไฟล์ `supabase_update_v2.sql` → Run

---

## ขั้นตอนที่ 2 — ตั้งค่า Line Notify

### สร้าง Line Notify Token:
1. ไปที่ https://notify-bot.line.me/th/
2. Login ด้วย Line account
3. กด **"สร้าง token"**
4. ตั้งชื่อ เช่น "StockOffice"
5. เลือก **"1:1 กับ LINE Notify"** (ส่งหา Admin คนเดียว)
   หรือเลือก **Group** ถ้าอยากส่งเข้า Group Line ของทีม
6. กด **"สร้าง"** → คัดลอก token ที่ได้

### เพิ่ม Token ใน Vercel:
1. Vercel → project stock-office → **Settings** → **Environment Variables**
2. กด **Add**:
   - Key: `REACT_APP_LINE_NOTIFY_TOKEN`
   - Value: token ที่คัดลอกมา
3. กด **Save** → **Redeploy**

---

## ขั้นตอนที่ 3 — ตั้งค่า Admin

หลัง deploy แล้ว ต้องเปลี่ยน role ของ Admin ใน Supabase:

1. Supabase → **SQL Editor** → New query
2. รันคำสั่งนี้ (เปลี่ยน email เป็นของ Admin):

```sql
update profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'your-admin@email.com'
);
```

3. กด **Run** → Admin จะเห็นเมนู อนุมัติ + รายงาน เพิ่มขึ้นมา

---

## สรุปสิ่งที่เปลี่ยนใน v2

| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| 🖼️ รูปสินค้า | Admin อัพโหลดรูปได้, แสดงในการ์ดทุกหน้า |
| 👑 Admin | รับเข้า, เบิกโดยตรง, อนุมัติ, ดูรายงาน |
| 👤 User | ขอเบิกได้อย่างเดียว ต้องรอ Admin อนุมัติ |
| 📱 Line Notify | แจ้ง Admin ทันทีเมื่อมีคำขอเบิก |
| ✅ Approve System | Admin อนุมัติ/ปฏิเสธ พร้อมหักสต็อกอัตโนมัติ |
