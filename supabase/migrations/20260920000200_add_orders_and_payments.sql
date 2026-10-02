create table public.orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  total numeric(12, 2) not null check (total >= 0),
  currency text not null default 'ARS' check (char_length(currency) = 3),
  mercadopago_preference_id text unique,
  mercadopago_payment_id text unique,
  payer_name text,
  payer_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index orders_status_created_idx on public.orders (status, created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant select on table public.orders, public.order_items to authenticated;

create policy "admins consultan pedidos"
on public.orders for select
to authenticated
using ((select public.is_admin()));

create policy "admins consultan items de pedidos"
on public.order_items for select
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
  updated_items integer;
begin
  if p_status not in ('pending', 'approved', 'rejected', 'cancelled') then
    raise exception 'Invalid payment status';
  end if;

  select status into current_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return false;
  end if;

  if current_status = 'approved' then
    return true;
  end if;

  if p_status = 'approved' then
    update public.products as products
    set stock = products.stock - items.quantity
    from public.order_items as items
    where items.order_id = p_order_id
      and products.id = items.product_id
      and products.stock >= items.quantity;

    get diagnostics updated_items = row_count;
    if updated_items <> (select count(*) from public.order_items where order_id = p_order_id) then
      raise exception 'Insufficient stock for order %', p_order_id;
    end if;
  end if;

  update public.orders
  set status = p_status,
      mercadopago_payment_id = coalesce(p_payment_id, mercadopago_payment_id)
  where id = p_order_id;

  return true;
end;
$$;

revoke all on function public.confirm_order_payment(uuid, text, text) from public;
grant execute on function public.confirm_order_payment(uuid, text, text) to service_role;