-- Cada presentación tiene precio y stock propios. Se conserva la fila de producto
-- como ficha comercial y se migra su precio/stock histórico a una variante inicial.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 40),
  size_ml integer check (size_ml > 0),
  price numeric(12, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, label)
);

create index product_variants_product_active_order_idx
  on public.product_variants (product_id, is_active, sort_order, created_at);

create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

insert into public.product_variants (product_id, label, size_ml, price, stock)
select id, coalesce(size_ml::text || ' ml', 'Presentación única'), size_ml, price, stock
from public.products;

alter table public.order_items
  add column variant_id uuid references public.product_variants(id) on delete restrict,
  add column variant_label text;

update public.order_items as items
set variant_id = variants.id,
    variant_label = variants.label,
    product_name = products.brand || ' ' || products.name || ' — ' || variants.label
from public.products as products
join public.product_variants as variants on variants.product_id = products.id
where items.product_id = products.id;

alter table public.order_items
  alter column variant_id set not null,
  alter column variant_label set not null;

create index order_items_variant_id_idx on public.order_items (variant_id);

alter table public.product_variants enable row level security;
revoke all on table public.product_variants from anon, authenticated;
grant select on table public.product_variants to anon, authenticated;
grant select, insert, update, delete on table public.product_variants to service_role;

create policy "variantes activas de catalogo publicado visibles"
on public.product_variants for select
to anon, authenticated
using (
  (select public.is_admin())
  or (is_active and exists (
    select 1 from public.products
    where products.id = product_variants.product_id and products.is_published
  ))
);

create policy "admins crean variantes"
on public.product_variants for insert
to authenticated
with check ((select public.is_admin()));

create policy "admins actualizan variantes"
on public.product_variants for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "admins eliminan variantes"
on public.product_variants for delete
to authenticated
using ((select public.is_admin()));

create or replace function public.confirm_order_payment(
  p_order_id uuid,
  p_payment_id text,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
  updated_variants integer;
  ordered_variants integer;
begin
  if p_status not in ('pending', 'approved', 'rejected', 'cancelled') then
    raise exception 'Invalid payment status';
  end if;

  select status into current_status from public.orders where id = p_order_id for update;
  if not found then return false; end if;
  if current_status = 'approved' then return true; end if;

  if p_status = 'approved' then
    with requested as (
      select variant_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = p_order_id
      group by variant_id
    ), updated as (
      update public.product_variants as variants
      set stock = variants.stock - requested.quantity
      from requested
      where variants.id = requested.variant_id
        and variants.stock >= requested.quantity
      returning variants.id
    )
    select (select count(*) from updated), (select count(*) from requested)
    into updated_variants, ordered_variants;

    if updated_variants <> ordered_variants then
      raise exception 'Insufficient stock for order %', p_order_id;
    end if;
  end if;

  update public.orders
  set status = p_status, mercadopago_payment_id = coalesce(p_payment_id, mercadopago_payment_id)
  where id = p_order_id;
  return true;
end;
$$;

revoke all on function public.confirm_order_payment(uuid, text, text) from public;
grant execute on function public.confirm_order_payment(uuid, text, text) to service_role;
