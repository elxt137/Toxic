-- Preserve original records before catalog normalization; inaccessible to storefront clients.
create table store_private.catalog_change_backups (
  migration text primary key, snapshot jsonb not null, created_at timestamptz not null default now()
);
alter table store_private.catalog_change_backups enable row level security;
revoke all on store_private.catalog_change_backups from public,anon,authenticated;
insert into store_private.catalog_change_backups(migration,snapshot)
select '20261015221735', jsonb_build_object('products',(select jsonb_agg(to_jsonb(p)) from public.products p),'variants',(select jsonb_agg(to_jsonb(v)) from public.product_variants v));
alter table public.products drop constraint products_brand_check;
alter table public.products alter column brand set default '';
alter table public.products add constraint products_brand_check check (brand='' or char_length(brand) between 2 and 100);
alter table public.products add column option_name text not null default 'Presentación' check (char_length(trim(option_name)) between 1 and 30);
alter table public.products add column video_urls text[] not null default '{}' check (cardinality(video_urls)<=3);
alter table public.products add column merged_into uuid references public.products(id) check (merged_into<>id);
alter table public.product_variants add column image_url text check (image_url is null or image_url ~* '^https?://');
create table public.product_redirects (
  old_slug text primary key check(old_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  new_slug text not null check(new_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and new_slug<>old_slug)
);
alter table public.product_redirects enable row level security;
grant select on public.product_redirects to anon,authenticated;
grant insert,update,delete on public.product_redirects to authenticated;
create policy public_product_redirects on public.product_redirects for select using (exists(select 1 from public.products p where p.slug=new_slug and p.is_published and p.merged_into is null));
create policy admin_product_redirects on public.product_redirects for all to authenticated using(public.is_admin()) with check(public.is_admin());
update storage.buckets set file_size_limit=26214400,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/webm'] where id='product-images';

create or replace function public.save_catalog_product(p_id uuid, p_product jsonb, p_variants jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  saved_id uuid;
  item jsonb;
  variant_id uuid;
  keep_ids uuid[] := '{}';
  images text[];
  position integer := 0;
  videos text[];
  option_label text := coalesce(p_product->>'option_name','Presentación');
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Administrator required' using errcode = '42501'; end if;
  if jsonb_typeof(p_variants) is distinct from 'array' or jsonb_array_length(p_variants) not between 1 and 50 then raise exception 'Invalid presentations'; end if;
  for item in select value from jsonb_array_elements(p_variants) loop
    if length(trim(item->>'label')) not between 1 and 40 or (item->>'price')::numeric not between 0 and 999999999 or (item->>'stock')::numeric not between 0 and 999999 or (item->>'stock')::numeric <> trunc((item->>'stock')::numeric) or ((item->>'size_ml') is not null and ((item->>'size_ml')::numeric not between 0.1 and 9999 or (item->>'size_ml')::numeric * 10 <> trunc((item->>'size_ml')::numeric * 10))) then raise exception 'Invalid presentation'; end if;
  end loop;
  if jsonb_typeof(p_product->'image_urls') is distinct from 'array' then raise exception 'Invalid gallery'; end if;
  select coalesce(array_agg(value), '{}') into images from jsonb_array_elements_text(p_product->'image_urls');
  if cardinality(images) > 6 or exists (select 1 from unnest(images) photo where photo !~* '^https?://') then raise exception 'Invalid photos'; end if;
  if jsonb_typeof(coalesce(p_product->'video_urls','[]'::jsonb)) is distinct from 'array' then raise exception 'Invalid videos'; end if;
  select coalesce(array_agg(value),'{}') into videos from jsonb_array_elements_text(coalesce(p_product->'video_urls','[]'::jsonb));
  if cardinality(videos)>3 or exists(select 1 from unnest(videos) video where video !~* '^https?://') then raise exception 'Invalid videos'; end if;
  if length(trim(option_label)) not between 1 and 30 then raise exception 'Invalid option'; end if;
  if exists(select 1 from jsonb_array_elements(p_variants) v group by lower(trim(v->>'label')) having count(*)>1) then raise exception 'Duplicate presentation'; end if;
  if length(trim(p_product->>'name')) not between 2 and 120 or (length(trim(coalesce(p_product->>'brand',''))) <> 0 and length(trim(coalesce(p_product->>'brand',''))) not between 2 and 100) then raise exception 'Invalid product'; end if;
  if p_id is null then
    if exists (select 1 from jsonb_array_elements(p_variants) v where v->>'id' is not null) then raise exception 'New variants cannot reference existing IDs'; end if;
    saved_id := gen_random_uuid();
    insert into public.products(id,name,slug,brand,description,category,price,stock,size_ml,concentration,image_url,image_urls,option_name,video_urls,is_published,is_featured,sort_order,currency)
    values(saved_id,trim(p_product->>'name'),'producto-'||saved_id::text,trim(coalesce(p_product->>'brand','')),coalesce(p_product->>'description',''),p_product->>'category',(p_variants->0->>'price')::numeric,(p_variants->0->>'stock')::integer,(p_variants->0->>'size_ml')::numeric,p_product->>'concentration',images[1],images,trim(option_label),videos,(p_product->>'is_published')::boolean,(p_product->>'is_featured')::boolean,(p_product->>'sort_order')::integer,'ARS');
  else
    select id into saved_id from public.products where id = p_id and merged_into is null for update;
    if saved_id is null then raise exception 'Product not found'; end if;
    update public.products set name=trim(p_product->>'name'),brand=trim(coalesce(p_product->>'brand','')),description=coalesce(p_product->>'description',''),category=p_product->>'category',price=(p_variants->0->>'price')::numeric,stock=(p_variants->0->>'stock')::integer,size_ml=(p_variants->0->>'size_ml')::numeric,concentration=p_product->>'concentration',image_url=images[1],image_urls=images,option_name=trim(option_label),video_urls=videos,is_published=(p_product->>'is_published')::boolean,is_featured=(p_product->>'is_featured')::boolean,sort_order=(p_product->>'sort_order')::integer where id=saved_id;
  end if;
  for item in select value from jsonb_array_elements(p_variants) loop
    if length(trim(item->>'label')) not between 1 and 40 or (item->>'price')::numeric not between 0 and 999999999 or (item->>'stock')::numeric not between 0 and 999999 or (item->>'stock')::numeric <> trunc((item->>'stock')::numeric) or ((item->>'size_ml') is not null and ((item->>'size_ml')::numeric not between 0.1 and 9999 or (item->>'size_ml')::numeric * 10 <> trunc((item->>'size_ml')::numeric * 10))) then raise exception 'Invalid presentation'; end if;
    variant_id := coalesce((item->>'id')::uuid, gen_random_uuid());
    if variant_id = any(keep_ids) then raise exception 'Duplicate presentation'; end if;
    if item->>'id' is not null then
      if not exists (select 1 from public.product_variants where id=variant_id and product_id=saved_id) then raise exception 'Presentation belongs to another product'; end if;
      update public.product_variants set image_url=case when item->>'image_url'=any(images) then item->>'image_url' else null end,label=trim(item->>'label'),size_ml=(item->>'size_ml')::numeric,price=(item->>'price')::numeric,stock=(item->>'stock')::integer,is_active=(item->>'is_active')::boolean,sort_order=position where id=variant_id and product_id=saved_id;
    else
      insert into public.product_variants(id,product_id,image_url,label,size_ml,price,stock,is_active,sort_order) values(variant_id,saved_id,case when item->>'image_url'=any(images) then item->>'image_url' else null end,trim(item->>'label'),(item->>'size_ml')::numeric,(item->>'price')::numeric,(item->>'stock')::integer,(item->>'is_active')::boolean,position)
      on conflict (product_id,label) do update set image_url=excluded.image_url,size_ml=excluded.size_ml,price=excluded.price,stock=excluded.stock,is_active=excluded.is_active,sort_order=excluded.sort_order
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

-- Remove the store placeholder brand, preserving explicitly assigned manufacturer brands.
update public.products set brand='' where upper(trim(brand))='RC2';
-- Consolidate only the confirmed equivalent valve caps. Preserve variant IDs, prices and stock.
do $$
declare
  canonical uuid;
  source record;
  photos text[] := '{}';
  color_index integer := 0;
  photo text;
  target_slug text := 'tapon-de-valvula-de-aluminio-deportivo';
begin
  select id into canonical from public.products where slug='tapon-de-valvula-de-aluminio-deportivo-color-rojo' for update;
  if canonical is null then return; end if;
  for source in select p.*, c.color from (values
    ('tapon-de-valvula-de-aluminio-deportivo-color-rojo','Rojo',0),
    ('tapon-de-valvula-de-aluminio-deportivo-color-gris','Gris',1),
    ('tapon-de-valvula-de-aluminio-deportivo-color-negro','Negro',2)
  ) c(slug,color,position) join public.products p on p.slug=c.slug order by c.position for update of p loop
    if (select count(*) from public.product_variants v where v.product_id=source.id and v.is_active)<>1 then raise exception 'Valve caps require exactly one active variant per color'; end if;
    update public.product_variants set product_id=canonical,label=source.color,image_url=coalesce(source.image_urls[1],source.image_url),sort_order=color_index where product_id=source.id and is_active;
    foreach photo in array source.image_urls loop
      if not photo=any(photos) then photos:=array_append(photos,photo); end if;
    end loop;
    insert into public.product_redirects values(source.slug,target_slug);
    if source.id<>canonical then update public.products set is_published=false,merged_into=canonical,stock=0 where id=source.id; end if;
    color_index:=color_index+1;
  end loop;
  if color_index<>3 or cardinality(photos)>6 then raise exception 'Incomplete valve cap merge or gallery overflow'; end if;
  update public.products set name='Tapón de Válvula de Aluminio Deportivo - Pack 4u',slug=target_slug,option_name='Color',image_urls=photos,image_url=photos[1] where id=canonical;
end $$;
