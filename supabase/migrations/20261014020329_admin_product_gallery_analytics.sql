-- Existing products retain their cover; all writes continue to use RLS.
-- Vehicle-care packs include 1, 5 and 9 litre presentations.
alter table public.products alter column size_ml type numeric(5,1);
alter table public.product_variants alter column size_ml type numeric(5,1);
alter table public.products add column image_urls text[] not null default '{}';
update public.products set image_urls = array[image_url] where image_url is not null;
alter table public.products add constraint product_gallery_limit check (cardinality(image_urls) <= 6);
alter table public.storefront_settings
  add column google_analytics_id text,
  add column google_analytics_enabled boolean not null default false,
  add constraint analytics_id_format check (google_analytics_id is null or google_analytics_id ~ '^G-[A-Z0-9]{5,20}$'),
  add constraint analytics_enabled_requires_id check (not google_analytics_enabled or google_analytics_id is not null);
update storage.buckets set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'] where id = 'product-images';
grant update(google_analytics_id,google_analytics_enabled) on public.storefront_settings to authenticated;

create function public.save_catalog_product(p_id uuid, p_product jsonb, p_variants jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  saved_id uuid;
  item jsonb;
  variant_id uuid;
  keep_ids uuid[] := '{}';
  images text[];
  position integer := 0;
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator required' using errcode = '42501'; end if;
  if jsonb_typeof(p_variants) is distinct from 'array' or jsonb_array_length(p_variants) not between 1 and 50 then raise exception 'Invalid presentations'; end if;
  for item in select value from jsonb_array_elements(p_variants) loop
    if length(trim(item->>'label')) not between 1 and 40 or (item->>'price')::numeric not between 0 and 999999999 or (item->>'stock')::numeric not between 0 and 999999 or (item->>'stock')::numeric <> trunc((item->>'stock')::numeric) or ((item->>'size_ml') is not null and ((item->>'size_ml')::numeric not between 0.1 and 9999 or (item->>'size_ml')::numeric * 10 <> trunc((item->>'size_ml')::numeric * 10))) then raise exception 'Invalid presentation'; end if;
  end loop;
  if jsonb_typeof(p_product->'image_urls') is distinct from 'array' then raise exception 'Invalid gallery'; end if;
  select coalesce(array_agg(value), '{}') into images from jsonb_array_elements_text(p_product->'image_urls');
  if cardinality(images) > 6 or exists (select 1 from unnest(images) photo where photo !~* '^https?://') then raise exception 'Invalid photos'; end if;
  if length(trim(p_product->>'name')) not between 2 and 120 or length(trim(p_product->>'brand')) not between 2 and 100 then raise exception 'Invalid product'; end if;
  if p_id is null then
    if exists (select 1 from jsonb_array_elements(p_variants) v where v->>'id' is not null) then raise exception 'New variants cannot reference existing IDs'; end if;
    saved_id := gen_random_uuid();
    insert into public.products(id,name,slug,brand,description,category,price,stock,size_ml,concentration,image_url,image_urls,is_published,is_featured,sort_order,currency)
    values(saved_id,trim(p_product->>'name'),'producto-'||saved_id::text,trim(p_product->>'brand'),coalesce(p_product->>'description',''),p_product->>'category',(p_variants->0->>'price')::numeric,(p_variants->0->>'stock')::integer,(p_variants->0->>'size_ml')::numeric,p_product->>'concentration',images[1],images,(p_product->>'is_published')::boolean,(p_product->>'is_featured')::boolean,(p_product->>'sort_order')::integer,'ARS');
  else
    select id into saved_id from public.products where id = p_id for update;
    if saved_id is null then raise exception 'Product not found'; end if;
    update public.products set name=trim(p_product->>'name'),brand=trim(p_product->>'brand'),description=coalesce(p_product->>'description',''),category=p_product->>'category',price=(p_variants->0->>'price')::numeric,stock=(p_variants->0->>'stock')::integer,size_ml=(p_variants->0->>'size_ml')::numeric,concentration=p_product->>'concentration',image_url=images[1],image_urls=images,is_published=(p_product->>'is_published')::boolean,is_featured=(p_product->>'is_featured')::boolean,sort_order=(p_product->>'sort_order')::integer where id=saved_id;
  end if;
  for item in select value from jsonb_array_elements(p_variants) loop
    if length(trim(item->>'label')) not between 1 and 40 or (item->>'price')::numeric not between 0 and 999999999 or (item->>'stock')::numeric not between 0 and 999999 or (item->>'stock')::numeric <> trunc((item->>'stock')::numeric) or ((item->>'size_ml') is not null and ((item->>'size_ml')::numeric not between 0.1 and 9999 or (item->>'size_ml')::numeric * 10 <> trunc((item->>'size_ml')::numeric * 10))) then raise exception 'Invalid presentation'; end if;
    variant_id := coalesce((item->>'id')::uuid, gen_random_uuid());
    if variant_id = any(keep_ids) then raise exception 'Duplicate presentation'; end if;
    if item->>'id' is not null then
      if not exists (select 1 from public.product_variants where id=variant_id and product_id=saved_id) then raise exception 'Presentation belongs to another product'; end if;
      update public.product_variants set label=trim(item->>'label'),size_ml=(item->>'size_ml')::numeric,price=(item->>'price')::numeric,stock=(item->>'stock')::integer,is_active=(item->>'is_active')::boolean,sort_order=position where id=variant_id and product_id=saved_id;
    else
      insert into public.product_variants(id,product_id,label,size_ml,price,stock,is_active,sort_order) values(variant_id,saved_id,trim(item->>'label'),(item->>'size_ml')::numeric,(item->>'price')::numeric,(item->>'stock')::integer,(item->>'is_active')::boolean,position)
      on conflict (product_id,label) do update set size_ml=excluded.size_ml,price=excluded.price,stock=excluded.stock,is_active=excluded.is_active,sort_order=excluded.sort_order
      returning id into variant_id;
    end if;
    if variant_id = any(keep_ids) then raise exception 'Duplicate presentation'; end if;
    keep_ids := array_append(keep_ids,variant_id);
    position := position + 1;
  end loop;
  -- Preserve references from orders instead of deleting historical presentations.
  update public.product_variants set is_active=false where product_id=saved_id and not (id = any(keep_ids));
  return saved_id;
end;
$$;
revoke all on function public.save_catalog_product(uuid,jsonb,jsonb) from public, anon;
grant execute on function public.save_catalog_product(uuid,jsonb,jsonb) to authenticated;
