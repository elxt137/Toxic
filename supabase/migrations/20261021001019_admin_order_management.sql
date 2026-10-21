alter table public.orders
  add column payment_method text not null default 'mercadopago' check (payment_method in ('mercadopago','bank_transfer')),
  add column payment_type text check (payment_type is null or char_length(payment_type) between 1 and 80),
  add column paid_at timestamptz,
  add column payment_confirmed_by uuid,
  add column created_by uuid,
  add column delivery_method text check (delivery_method in ('home','branch','pickup')),
  add column transfer_receipt_path text,
  add constraint orders_receipt_path_check check (transfer_receipt_path is null or
    (payment_method='bank_transfer' and transfer_receipt_path ~ ('^' || id::text || '/[0-9a-f-]{36}\.(pdf|jpg|png)$'))),
  add constraint orders_transfer_provider_check check (payment_method <> 'bank_transfer' or (mercadopago_payment_id is null and mercadopago_preference_id is null));
create index orders_payment_method_created_idx on public.orders(payment_method,created_at desc);
grant update(transfer_receipt_path) on public.orders to authenticated;

-- Privileged transitions stay outside the exposed schema. No broad UPDATE grants
-- on status or stock are needed; Auth identity and allowlist are checked inside.
create function store_private.create_bank_transfer_order(p_request_id uuid,p_customer jsonb,p_items jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare existing public.orders%rowtype; entry jsonb; variant public.product_variants%rowtype;
  product public.products%rowtype; amount numeric:=0; count_lines integer; email text; phone text;
begin
  if (select auth.uid()) is null or not public.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
  if p_request_id is null then raise exception 'Missing request ID'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
  select * into existing from public.orders where id=p_request_id;
  if found then
    if existing.created_by=(select auth.uid()) and existing.payment_method='bank_transfer' then return existing.id; end if;
    raise exception 'Order already exists';
  end if;
  if jsonb_typeof(p_customer) is distinct from 'object' or jsonb_typeof(p_items) is distinct from 'array' then raise exception 'Invalid order'; end if;
  if coalesce(length(trim(p_customer->>'name')),0) not between 2 and 120
    or coalesce(length(trim(p_customer->>'address')),0) not between 5 and 400
    or coalesce(p_customer->>'delivery','') not in ('home','branch','pickup') then raise exception 'Invalid customer'; end if;
  email:=nullif(trim(p_customer->>'email'),'');
  phone:=regexp_replace(coalesce(p_customer->>'phone',''),'[^0-9]','','g');
  if phone !~ '^[0-9]{10,15}$' or (email is not null and (length(email)>254 or email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')) then raise exception 'Invalid contact'; end if;
  count_lines:=jsonb_array_length(p_items);
  if count_lines not between 1 and 50 or exists(select 1 from jsonb_array_elements(p_items) x where coalesce(x->>'quantity','') !~ '^[1-9][0-9]{0,2}$' or x->>'variant_id' is null)
    or (select count(distinct x->>'variant_id') from jsonb_array_elements(p_items) x)<>count_lines then raise exception 'Invalid lines'; end if;
  perform 1 from public.product_variants where id in(select (x->>'variant_id')::uuid from jsonb_array_elements(p_items) x) order by id for share;
  for entry in select value from jsonb_array_elements(p_items) loop
    select * into variant from public.product_variants where id=(entry->>'variant_id')::uuid and is_active;
    if not found or variant.stock<(entry->>'quantity')::integer then raise exception 'Unavailable variant'; end if;
    select * into product from public.products where id=variant.product_id and merged_into is null;
    if not found or product.currency<>'ARS' then raise exception 'Unavailable product'; end if;
    amount:=amount+variant.price*(entry->>'quantity')::integer;
  end loop;
  if amount<=0 or amount>9999999999.99 then raise exception 'Invalid total'; end if;
  insert into public.orders(id,status,total,subtotal,currency,payer_name,payer_email,buyer_phone,shipping_street,payment_method,created_by,delivery_method,shipping_destination)
  values(p_request_id,'pending',amount,amount,'ARS',trim(p_customer->>'name'),lower(email),phone,trim(p_customer->>'address'),'bank_transfer',(select auth.uid()),p_customer->>'delivery',case when p_customer->>'delivery'='pickup' then null else p_customer->>'delivery' end);
  for entry in select value from jsonb_array_elements(p_items) loop
    select * into variant from public.product_variants where id=(entry->>'variant_id')::uuid;
    select * into product from public.products where id=variant.product_id;
    insert into public.order_items(order_id,product_id,variant_id,variant_label,product_name,unit_price,list_unit_price,quantity)
    values(p_request_id,product.id,variant.id,variant.label,product.name,variant.price,variant.price,(entry->>'quantity')::integer);
  end loop;
  return p_request_id;
end $$;
revoke all on function store_private.create_bank_transfer_order(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function store_private.create_bank_transfer_order(uuid,jsonb,jsonb) to authenticated;
create function public.create_bank_transfer_order(p_request_id uuid,p_customer jsonb,p_items jsonb)
returns uuid language sql security invoker set search_path='' as $$ select store_private.create_bank_transfer_order(p_request_id,p_customer,p_items); $$;
revoke all on function public.create_bank_transfer_order(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.create_bank_transfer_order(uuid,jsonb,jsonb) to authenticated;

create function store_private.approve_bank_transfer(p_order_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare target public.orders%rowtype; needed integer; changed integer;
begin
  if (select auth.uid()) is null or not public.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
  select * into target from public.orders where id=p_order_id for update;
  if not found or target.payment_method<>'bank_transfer' then return false; end if;
  if target.status='approved' then return true; end if;
  if target.status<>'pending' then return false; end if;
  if not exists(select 1 from public.order_items where order_id=p_order_id) then return false; end if;
  perform 1 from public.product_variants v where v.id in(select variant_id from public.order_items where order_id=p_order_id) order by v.id for update;
  with requested as (
    select variant_id,sum(quantity)::integer as quantity from public.order_items where order_id=p_order_id group by variant_id
  ), updated as (
    update public.product_variants v set stock=v.stock-r.quantity from requested r where v.id=r.variant_id and v.stock>=r.quantity returning v.id
  ) select (select count(*) from requested),(select count(*) from updated) into needed,changed;
  if needed<>changed then raise exception 'Insufficient stock'; end if;
  update public.orders set status='approved',paid_at=now(),payment_type='bank_transfer',payment_confirmed_by=(select auth.uid()) where id=p_order_id;
  return true;
end $$;
revoke all on function store_private.approve_bank_transfer(uuid) from public,anon,authenticated;
grant execute on function store_private.approve_bank_transfer(uuid) to authenticated;
create function public.approve_bank_transfer(p_order_id uuid) returns boolean language sql security invoker set search_path='' as $$ select store_private.approve_bank_transfer(p_order_id); $$;
revoke all on function public.approve_bank_transfer(uuid) from public,anon;
grant execute on function public.approve_bank_transfer(uuid) to authenticated;

-- Keep existing callers compatible, and reject provider notifications for manual orders.
create or replace function public.confirm_verified_order_payment(p_order_id uuid,p_payment_id text,p_status text,p_amount numeric,p_currency text,p_preference_id text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare target public.orders%rowtype;
begin
  select * into target from public.orders where id=p_order_id for update;
  if not found or target.payment_method<>'mercadopago' or p_payment_id is null or p_payment_id='' or target.total is distinct from p_amount or target.currency is distinct from p_currency
    or target.mercadopago_preference_id is null or target.mercadopago_preference_id is distinct from p_preference_id then return false; end if;
  if target.status='approved' then return target.mercadopago_payment_id=p_payment_id; end if;
  if exists(select 1 from public.orders where mercadopago_payment_id=p_payment_id and id<>p_order_id) then return false; end if;
  return public.confirm_order_payment(p_order_id,p_payment_id,p_status);
end $$;

create function public.record_verified_payment(p_order_id uuid,p_payment_id text,p_status text,p_amount numeric,p_currency text,p_preference_id text,p_payment_type text,p_paid_at timestamptz)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
  if not public.confirm_verified_order_payment(p_order_id,p_payment_id,p_status,p_amount,p_currency,p_preference_id) then return false; end if;
  update public.orders set payment_type=coalesce(payment_type,p_payment_type),paid_at=case when p_status='approved' then coalesce(paid_at,p_paid_at) else paid_at end
    where id=p_order_id and mercadopago_payment_id=p_payment_id;
  return true;
end $$;
revoke all on function public.record_verified_payment(uuid,text,text,numeric,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.record_verified_payment(uuid,text,text,numeric,text,text,text,timestamptz) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('transfer-receipts','transfer-receipts',false,5242880,array['application/pdf','image/jpeg','image/png']);
create policy "admins read transfer receipts" on storage.objects for select to authenticated
using(bucket_id='transfer-receipts' and (select public.is_admin()));
create policy "admins upload pending transfer receipts" on storage.objects for insert to authenticated
with check(bucket_id='transfer-receipts' and (select public.is_admin()) and exists(
  select 1 from public.orders o where o.id::text=(storage.foldername(name))[1] and o.payment_method='bank_transfer' and o.status='pending'
));
