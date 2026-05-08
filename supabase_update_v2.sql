-- ========================================
-- StockOffice v2 — SQL Update
-- วางใน Supabase SQL Editor แล้วกด Run
-- ========================================

-- 1. เพิ่มคอลัมน์รูปภาพใน products
alter table products add column if not exists image_url text;

-- 2. เพิ่ม role ใน profiles (มีแล้วแต่ตรวจสอบ)
alter table profiles add column if not exists role text not null default 'user'
  check (role in ('admin', 'user'));

-- 3. ตาราง คำขอเบิก (pending requests)
create table if not exists stock_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  product_name text not null,
  quantity integer not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_by uuid references auth.users(id),
  requester_name text,
  approved_by uuid references auth.users(id),
  approver_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Storage bucket สำหรับรูปสินค้า
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 5. RLS สำหรับ stock_requests
alter table stock_requests enable row level security;

create policy "authenticated read requests" on stock_requests
  for select using (auth.role() = 'authenticated');
create policy "authenticated insert requests" on stock_requests
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated update requests" on stock_requests
  for update using (auth.role() = 'authenticated');

-- 6. Storage policy — ทุกคนอัพโหลดได้, อ่านได้ทุกคน
create policy "allow upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "allow read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "allow delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');
