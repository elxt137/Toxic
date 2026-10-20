-- Keep legacy categories until administrators explicitly classify existing products.
-- No product data, order references or RLS policies are changed.
alter table public.products drop constraint products_category_check;
alter table public.products add constraint products_category_check
  check (category in ('Decant', 'Frasco completo', 'lavado', 'interior',
    'proteccion', 'brillo', 'cepillos', 'iluminacion', 'kits'));
alter table public.products alter column category set default 'lavado';
