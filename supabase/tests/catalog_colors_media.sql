begin;
insert into public.admin_allowlist(email) values ('colors-check@example.invalid');
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"11111111-1111-4111-8111-111111111111","email":"colors-check@example.invalid"}';
do $$
declare
  target_id uuid;
  variant_id uuid;
  payload jsonb := '{"name":"Colors check","brand":"","description":"","category":"Decant","concentration":null,"sort_order":0,"is_published":true,"is_featured":false,"option_name":"Color","image_urls":["https://example.invalid/red.avif","https://example.invalid/gray.gif"],"video_urls":["https://example.invalid/demo.webm"]}';
  variants jsonb := '[{"label":"Rojo","size_ml":null,"price":8000,"stock":2,"is_active":true,"image_url":"https://example.invalid/red.avif"},{"label":"Gris","size_ml":null,"price":8500,"stock":1,"is_active":true,"image_url":"https://example.invalid/gray.gif"}]';
begin
  target_id := public.save_catalog_product(null,payload,variants);
  perform set_config('test.colors_product',target_id::text,true);
  if not exists(select 1 from public.products p where p.id=target_id and p.brand='' and p.option_name='Color' and p.video_urls=array['https://example.invalid/demo.webm']) then raise exception 'Optional brand, colors or videos not persisted'; end if;
  select v.id into variant_id from public.product_variants v where v.product_id=target_id and v.label='Gris';
  if not exists(select 1 from public.product_variants v where v.id=variant_id and v.image_url='https://example.invalid/gray.gif' and v.stock=1 and v.price=8500) then raise exception 'Color details not persisted'; end if;
  perform public.save_catalog_product(target_id,payload || '{"image_urls":["https://example.invalid/gray.gif","https://example.invalid/red.avif"]}',variants);
  if not exists(select 1 from public.products p where p.id=target_id and p.image_url='https://example.invalid/gray.gif') then raise exception 'Gallery reorder did not change cover'; end if;
  insert into public.product_redirects(old_slug,new_slug) select 'colors-check-old',slug from public.products p where p.id=target_id;
end $$;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$ begin
  if not exists(select 1 from public.product_redirects where old_slug='colors-check-old') then raise exception 'Published redirect unavailable'; end if;
  begin perform public.save_catalog_product(null,'{}','[]'); raise exception 'Anonymous mutation accepted'; exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"11111111-1111-4111-8111-111111111111","email":"colors-check@example.invalid"}';
update public.products set is_published=false where id=current_setting('test.colors_product')::uuid;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$ begin
  if exists(select 1 from public.product_redirects where old_slug='colors-check-old') then raise exception 'Draft redirect leaked'; end if;
end $$;
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"22222222-2222-4222-8222-222222222222","email":"outside-colors@example.invalid"}';
do $$ begin
  begin perform public.save_catalog_product(null,'{}','[]'); raise exception 'Unauthorized mutation accepted'; exception when insufficient_privilege then null; end;
  begin insert into public.product_redirects values ('unauthorized','colors-check-old'); raise exception 'Unauthorized redirect accepted'; exception when insufficient_privilege then null; end;
end $$;
select 'PASS: optional brand, color stock/price/photos, videos, gallery order, redirects and authorization' as result;
rollback;
