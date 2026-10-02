-- Notta Decants: clasifica el formato comercial para el catálogo público.
alter table public.products
  add column category text not null default 'Decant'
  check (category in ('Decant', 'Frasco completo'));

create index products_category_public_order_idx
  on public.products (is_published, category, sort_order, created_at desc);
