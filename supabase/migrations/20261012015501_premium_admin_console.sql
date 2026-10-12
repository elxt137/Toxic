-- Private metadata never joins the public catalog.
create table public.product_admin_data (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost_price numeric(12,2) check (cost_price >= 0),
  barcode text unique check (barcode ~ '^[A-Z0-9-]{3,32}$'),
  updated_at timestamptz not null default now()
);
alter table public.product_admin_data enable row level security;
grant select, insert, update on public.product_admin_data to authenticated;
create policy "admins manage private product data" on public.product_admin_data
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create trigger product_admin_data_updated before update on public.product_admin_data
  for each row execute function public.set_updated_at();

alter table public.orders
  add column shipping_status text not null default 'preparing' check (shipping_status in ('preparing','in_transit','delivered')),
  add column transaction_status text not null default 'pending' check (transaction_status in ('pending','processed','completed')),
  add column tracking_number text,
  add column subtotal numeric(12,2),
  add column discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  add column coupon_code text;
update public.orders set subtotal = total, transaction_status = case when status='approved' then 'completed' else 'pending' end;
grant update (shipping_status,transaction_status,tracking_number) on public.orders to authenticated;
create policy "admins update order workflow" on public.orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{3,32}$'),
  kind text not null default 'percent' check (kind in ('percent','fixed')),
  value numeric(12,2) not null check (value > 0 and (kind <> 'percent' or value < 100)),
  usage_limit integer check (usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.coupons enable row level security;
grant select, insert, update on public.coupons to authenticated;
grant select, update on public.coupons to service_role;
create policy "admins manage coupons" on public.coupons for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter table public.orders add column coupon_id uuid references public.coupons(id) on delete restrict;
create index orders_coupon_id_idx on public.orders(coupon_id);

-- Called only by the checkout server; the subtotal comes from the persisted order.
-- A pending order reserves a use until approved or explicitly cancelled/rejected.
create function public.reserve_order_coupon(p_order_id uuid,p_code text)
returns numeric language plpgsql security invoker set search_path = '' as $$
declare o public.orders%rowtype; c public.coupons%rowtype; discount numeric;
begin
  select * into o from public.orders where id=p_order_id for update;
  if not found or o.status <> 'pending' or o.coupon_id is not null then raise exception 'Pedido inválido para aplicar cupón'; end if;
  select * into c from public.coupons where code=upper(trim(p_code)) for update;
  if not found or not c.active or (c.expires_at is not null and c.expires_at < now())
    or (c.usage_limit is not null and c.used_count >= c.usage_limit) then raise exception 'El cupón no está disponible'; end if;
  discount := case when c.kind='percent' then round(o.total*c.value/100,2) else c.value end;
  if discount <= 0 or discount >= o.total then raise exception 'El descuento no es válido para este pedido'; end if;
  update public.coupons set used_count=used_count+1 where id=c.id;
  update public.orders set subtotal=o.total,discount_amount=discount,total=o.total-discount,coupon_id=c.id,coupon_code=c.code where id=o.id;
  return discount;
end $$;
revoke all on function public.reserve_order_coupon(uuid,text) from public;
grant execute on function public.reserve_order_coupon(uuid,text) to service_role;

create function public.sync_order_transaction() returns trigger language plpgsql security invoker set search_path = '' as $$
declare capacity integer; limit_count integer;
begin
  if new.status='approved' and old.status <> 'approved' then new.transaction_status := 'completed'; end if;
  if new.coupon_id is not null and new.status <> old.status then
    if new.status in ('cancelled','rejected') and old.status not in ('cancelled','rejected') then
      update public.coupons set used_count=greatest(used_count-1,0) where id=new.coupon_id;
    elsif old.status in ('cancelled','rejected') and new.status not in ('cancelled','rejected') then
      select used_count,usage_limit into capacity,limit_count from public.coupons where id=new.coupon_id for update;
      if limit_count is not null and capacity >= limit_count then raise exception 'El cupón agotó sus usos'; end if;
      update public.coupons set used_count=used_count+1 where id=new.coupon_id;
    end if;
  end if;
  return new;
end $$;
create trigger orders_sync_transaction before update of status on public.orders
  for each row execute function public.sync_order_transaction();
