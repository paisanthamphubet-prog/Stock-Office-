-- ========================================
-- StockOffice — Supabase Schema
-- วิธีใช้: วางทั้งหมดนี้ใน Supabase SQL Editor แล้วกด Run
-- ========================================

-- 1. ตารางสินค้า
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'ทั่วไป',
  unit text not null default 'ชิ้น',
  quantity integer not null default 0,
  min_quantity integer not null default 5,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- 2. ตาราง log การเคลื่อนไหว
create table if not exists stock_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  product_name text not null,
  action text not null check (action in ('in', 'out')),
  quantity integer not null,
  note text,
  user_name text,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 3. ตาราง user profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz default now()
);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

alter table products enable row level security;
alter table stock_logs enable row level security;
alter table profiles enable row level security;

-- products: ทุก user ที่ login แล้วอ่านได้, แก้ไขได้ทุกคน
create policy "authenticated read products" on products
  for select using (auth.role() = 'authenticated');
create policy "authenticated insert products" on products
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated update products" on products
  for update using (auth.role() = 'authenticated');
create policy "authenticated delete products" on products
  for delete using (auth.role() = 'authenticated');

-- stock_logs: ทุก user อ่านและเพิ่มได้
create policy "authenticated read logs" on stock_logs
  for select using (auth.role() = 'authenticated');
create policy "authenticated insert logs" on stock_logs
  for insert with check (auth.role() = 'authenticated');

-- profiles: อ่านได้ทุกคน, แก้ได้เฉพาะตัวเอง
create policy "authenticated read profiles" on profiles
  for select using (auth.role() = 'authenticated');
create policy "own profile insert" on profiles
  for insert with check (auth.uid() = id);
create policy "own profile update" on profiles
  for update using (auth.uid() = id);

-- ========================================
-- Trigger: สร้าง profile อัตโนมัติเมื่อ sign up
-- ========================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ========================================
-- ข้อมูลตัวอย่าง (optional — ลบได้)
-- ========================================

insert into products (name, category, unit, quantity, min_quantity) values
  ('กระดาษ A4', 'กระดาษ & พิมพ์', 'รีม', 36, 10),
  ('ปากกาลูกลื่น', 'เครื่องเขียน', 'ด้าม', 9, 20),
  ('กาว UHU', 'อุปกรณ์ติด', 'หลอด', 0, 5),
  ('คลิปหนีบกระดาษ', 'เครื่องเขียน', 'กล่อง', 55, 10),
  ('แฟ้มเอกสาร', 'การจัดเก็บ', 'เล่ม', 25, 10),
  ('เทปใส', 'อุปกรณ์ติด', 'ม้วน', 12, 5);
