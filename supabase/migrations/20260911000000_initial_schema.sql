-- Aurea v1.0.0 - esquema inicial
create extension if not exists pgcrypto;

create table public.admin_allowlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(trim(email))),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique,
  brand text not null check (char_length(brand) between 2 and 100),
  description text not null default '' check (char_length(description) <= 800),
  price numeric(12, 2) not null check (price >= 0),
  currency text not null default 'ARS' check (char_length(currency) = 3),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  concentration text,
  size_ml integer check (size_ml > 0),
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_public_order_idx
  on public.products (is_published, sort_order, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_allowlist
    where email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
      and is_active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.admin_allowlist enable row level security;

-- "Automatically expose new tables" queda desactivado en Supabase.
-- Estos grants habilitan sólo las operaciones que luego restringe RLS.
grant usage on schema public to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;
grant select on table public.admin_allowlist to authenticated;

create policy "catalogo publicado visible para todos"
on public.products for select
to anon, authenticated
using (is_published = true or (select public.is_admin()));

create policy "admins crean productos"
on public.products for insert
to authenticated
with check ((select public.is_admin()));

create policy "admins actualizan productos"
on public.products for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "admins eliminan productos"
on public.products for delete
to authenticated
using ((select public.is_admin()));

create policy "usuario consulta su propia habilitacion"
on public.admin_allowlist for select
to authenticated
using (email = lower(coalesce((select auth.jwt()) ->> 'email', '')));

-- Bucket público para fotos. La UI v1 acepta también cualquier URL https.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

create policy "imagenes de productos visibles"
on storage.objects for select
to public
using (bucket_id = 'product-images');

create policy "admins suben imagenes"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "admins modifican imagenes"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()))
with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "admins eliminan imagenes"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));

-- IMPORTANTE: ejecutar después con el email real del administrador:
-- insert into public.admin_allowlist (email) values ('admin@dominio.com');
