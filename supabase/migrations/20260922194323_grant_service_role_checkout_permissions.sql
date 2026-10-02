-- Server-only checkout access. RLS remains enabled for every public table.
grant select on table public.products to service_role;
grant select, insert, update on table public.orders to service_role;
grant insert on table public.order_items to service_role;
