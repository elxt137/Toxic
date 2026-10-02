alter table public.orders
  add column buyer_first_name text,
  add column buyer_last_name text,
  add column buyer_phone text,
  add column shipping_street text,
  add column shipping_number text,
  add column shipping_apartment text,
  add column shipping_city text,
  add column shipping_province text,
  add column shipping_postal_code text;

comment on column public.orders.buyer_first_name is 'Nombre informado por la persona compradora durante el checkout.';
comment on column public.orders.buyer_last_name is 'Apellido informado por la persona compradora durante el checkout.';
comment on column public.orders.buyer_phone is 'Teléfono de contacto para la entrega.';
