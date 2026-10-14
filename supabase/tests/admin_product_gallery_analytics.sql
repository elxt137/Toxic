-- Synthetic fixtures only. No catalog data or analytics settings are retained.
begin;
insert into public.admin_allowlist(email) values ('gallery-check@example.invalid');
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","email":"gallery-check@example.invalid"}';
do $$
declare
  test_product_id uuid;
  other_id uuid;
  variant_id uuid;
  other_variant uuid;
  payload jsonb := '{"name":"Gallery check","brand":"RC2","description":"","category":"Decant","concentration":null,"sort_order":0,"is_published":false,"is_featured":false,"image_urls":["https://example.invalid/photo.jpg"]}';
  variants jsonb := '[{"label":"500 ml","size_ml":500,"price":1000,"stock":3,"is_active":true}]';
begin
  test_product_id := public.save_catalog_product(null,payload,variants);
  perform set_config('test.gallery_product', test_product_id::text, true);
  if not exists(select 1 from public.products where id=test_product_id and image_url='https://example.invalid/photo.jpg' and cardinality(image_urls)=1 and not is_published) then raise exception 'Create/gallery/draft failed'; end if;
  select id into variant_id from public.product_variants where product_variants.product_id=test_product_id;
  perform public.save_catalog_product(test_product_id, payload || '{"name":"Edited check","is_published":true}',jsonb_build_array(jsonb_build_object('id',variant_id,'label','500 ml','size_ml',500,'price',1200,'stock',2,'is_active',true)));
  if not exists(select 1 from public.products where id=test_product_id and name='Edited check' and price=1200 and is_published) then raise exception 'Edit failed'; end if;
  other_id := public.save_catalog_product(null,payload,variants);
  select id into other_variant from public.product_variants where product_variants.product_id=other_id;
  begin
    perform public.save_catalog_product(test_product_id,payload || '{"name":"Must roll back"}',jsonb_build_array(jsonb_build_object('id',other_variant,'label','500 ml','size_ml',500,'price',1,'stock',1,'is_active',true)));
    raise exception 'Cross-product presentation unexpectedly accepted';
  exception when raise_exception then
    if sqlerrm <> 'Presentation belongs to another product' then raise; end if;
  end;
  if not exists(select 1 from public.products where id=test_product_id and name='Edited check' and price=1200) then raise exception 'Atomic rollback failed'; end if;
  perform public.save_catalog_product(test_product_id,payload,'[{"label":"1 litro","size_ml":1000,"price":2000,"stock":4,"is_active":true}]');
  if exists(select 1 from public.product_variants where id=variant_id and is_active) then raise exception 'Removed presentation still active'; end if;
  perform public.save_catalog_product(test_product_id,payload,variants);
  if not exists(select 1 from public.product_variants where id=variant_id and is_active) then raise exception 'Restoring presentation failed'; end if;
  begin
    perform public.save_catalog_product(test_product_id,payload,'[{"label":"bad","size_ml":500,"price":-1,"stock":1,"is_active":true}]');
    raise exception 'Negative price accepted';
  exception when raise_exception then if sqlerrm <> 'Invalid presentation' then raise; end if; end;
  update public.storefront_settings set google_analytics_id='G-TEST123456',google_analytics_enabled=true where id=true;
  if not exists(select 1 from public.storefront_settings where id=true and google_analytics_enabled) then raise exception 'Analytics update failed'; end if;
end $$;
set local request.jwt.claims = '{"role":"authenticated","email":"outside-gallery@example.invalid"}';
do $$ declare affected integer; begin
  begin
    perform public.save_catalog_product(null,'{}','[]');
    raise exception 'Unauthorized catalog mutation accepted';
  exception when insufficient_privilege then null; end;
  update public.storefront_settings set google_analytics_enabled=false where id=true;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Unauthorized Analytics update'; end if;
end $$;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$ begin
  if exists(select 1 from public.products where id=current_setting('test.gallery_product')::uuid) then raise exception 'Draft leaked to public'; end if;
  begin perform public.save_catalog_product(null,'{}','[]'); raise exception 'Anonymous mutation accepted'; exception when insufficient_privilege then null; end;
end $$;
select 'PASS: atomic create/edit, gallery, presentation ownership, rollback, GA4, whitelist and draft isolation' as result;
rollback;
