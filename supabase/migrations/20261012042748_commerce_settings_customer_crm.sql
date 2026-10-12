alter table public.storefront_settings
  add column free_shipping_enabled boolean not null default true,
  add column free_shipping_threshold numeric(12,2) not null default 100000 check(free_shipping_threshold > 0),
  add column free_shipping_destination text not null default 'branch' check(free_shipping_destination in ('branch','home')),
  add column cart_whatsapp_enabled boolean not null default true;
grant update(free_shipping_enabled,free_shipping_threshold,free_shipping_destination,cart_whatsapp_enabled) on public.storefront_settings to authenticated;

create table public.customer_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check(char_length(trim(name)) between 2 and 100),
  discount_percent numeric(5,2) not null default 0 check(discount_percent between 0 and 99),
  created_at timestamptz not null default now()
);
alter table public.customer_groups enable row level security;
revoke all on public.customer_groups from anon,authenticated;
grant select,insert,update on public.customer_groups to authenticated;
grant select on public.customer_groups to service_role;
create policy "admins manage customer groups" on public.customer_groups for all to authenticated
  using((select public.is_admin())) with check((select public.is_admin()));
insert into public.customer_groups(slug,name) values ('retail','Minorista'),('professional','Mayorista/Detailer Profesional');

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check(char_length(trim(name)) between 2 and 160),
  email text not null unique check(email=lower(trim(email)) and char_length(email) between 3 and 254),
  phone text not null default '' check(char_length(phone)<=40),
  address text not null default '' check(char_length(address)<=500),
  group_id uuid not null references public.customer_groups(id) on delete restrict,
  registered_at timestamptz not null default now(),
  last_order_at timestamptz,
  updated_at timestamptz not null default now()
);
create index customers_group_idx on public.customers(group_id);
alter table public.customers enable row level security;
revoke all on public.customers from anon,authenticated;
grant select,insert,update on public.customers to authenticated;
grant select on public.customers to service_role;
create policy "admins manage customer contacts" on public.customers for all to authenticated
  using((select public.is_admin())) with check((select public.is_admin()));
create trigger customers_updated before update on public.customers for each row execute function public.set_updated_at();

alter table public.orders
  add column customer_id uuid references public.customers(id) on delete restrict,
  add column customer_group_name text,
  add column group_discount_percent numeric(5,2) not null default 0 check(group_discount_percent between 0 and 99),
  add column free_shipping_qualified boolean not null default false,
  add column free_shipping_threshold numeric(12,2),
  add column shipping_destination text check(shipping_destination in ('branch','home'));
create index orders_customer_idx on public.orders(customer_id);
alter table public.order_items add column list_unit_price numeric(12,2) check(list_unit_price>=0);

-- Bootstrap only paid contacts; no purchase is fabricated by CRM backfill.
insert into public.customers(name,email,phone,address,group_id,registered_at,last_order_at)
select distinct on (lower(trim(payer_email)))
  left(coalesce(nullif(trim(payer_name),''),'Sin nombre'),160),lower(trim(payer_email)),
  left(coalesce(buyer_phone,''),40),
  left(concat_ws(', ',shipping_street,shipping_number,shipping_apartment,shipping_city,shipping_province,shipping_postal_code),500),
  (select id from public.customer_groups where slug='retail'),
  min(created_at) over(partition by lower(trim(payer_email))),created_at
from public.orders where status='approved' and payer_email is not null and char_length(trim(payer_email)) between 3 and 254
order by lower(trim(payer_email)),created_at desc;
update public.orders o set customer_id=c.id from public.customers c where lower(trim(o.payer_email))=c.email;

-- This trigger is private and not executable by API roles. Only payment approval registers contacts.
create function store_private.register_paid_customer() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.status <> 'approved' or new.payer_email is null then return new; end if;
  if TG_OP='UPDATE' and old.status='approved' then return new; end if;
  insert into public.customers as current_contact(name,email,phone,address,group_id,registered_at,last_order_at)
  values(left(coalesce(nullif(trim(new.payer_name),''),'Sin nombre'),160),lower(trim(new.payer_email)),
    left(coalesce(new.buyer_phone,''),40),left(concat_ws(', ',new.shipping_street,new.shipping_number,new.shipping_apartment,new.shipping_city,new.shipping_province,new.shipping_postal_code),500),
    (select id from public.customer_groups where slug='retail'),new.created_at,new.created_at)
  on conflict(email) do update set
    name=case when current_contact.last_order_at is null or excluded.last_order_at>=current_contact.last_order_at then excluded.name else current_contact.name end,
    phone=case when current_contact.last_order_at is null or excluded.last_order_at>=current_contact.last_order_at then excluded.phone else current_contact.phone end,
    address=case when current_contact.last_order_at is null or excluded.last_order_at>=current_contact.last_order_at then excluded.address else current_contact.address end,
    registered_at=least(current_contact.registered_at,excluded.registered_at),
    last_order_at=greatest(current_contact.last_order_at,excluded.last_order_at)
  returning id into new.customer_id;
  return new;
end $$;
revoke all on function store_private.register_paid_customer() from public,anon,authenticated;
create trigger orders_register_customer before insert or update of status on public.orders
  for each row execute function store_private.register_paid_customer();

-- Read the authenticated user's official, confirmed identity, never a submitted checkout email.
create function store_private.my_customer_benefit() returns jsonb
language sql security definer set search_path='' as $$
  select jsonb_build_object('group_id',g.id,'group_name',g.name,'discount_percent',g.discount_percent)
  from auth.users u join public.customers c on c.email=lower(u.email)
  join public.customer_groups g on g.id=c.group_id
  where u.id=(select auth.uid()) and u.email_confirmed_at is not null;
$$;
revoke all on function store_private.my_customer_benefit() from public,anon;
grant execute on function store_private.my_customer_benefit() to authenticated;
create function public.get_my_customer_benefit() returns jsonb
language sql security invoker set search_path='' as $$ select store_private.my_customer_benefit(); $$;
revoke all on function public.get_my_customer_benefit() from public,anon;
grant execute on function public.get_my_customer_benefit() to authenticated;
