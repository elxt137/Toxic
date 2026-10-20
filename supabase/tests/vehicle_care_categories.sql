-- Run against a disposable local database after applying migrations.
begin;
do $$
declare
  saved_id uuid := gen_random_uuid();
  selected_category text;
begin
  insert into public.products(id,name,slug,brand,price,stock,category)
  values(saved_id,'Category regression','category-regression-' || saved_id::text,'RC2',100,1,'Decant');
  foreach selected_category in array array['lavado','interior','proteccion','brillo','cepillos','iluminacion','kits'] loop
    update public.products set category=selected_category where id=saved_id;
    if not exists(select 1 from public.products where id=saved_id and category=selected_category) then
      raise exception 'Category was not saved: %', selected_category;
    end if;
  end loop;
  begin
    update public.products set category='unknown' where id=saved_id;
    raise exception 'Unknown category was accepted';
  exception when check_violation then null;
  end;
  delete from public.products where id=saved_id;
  if exists(select 1 from public.products where id=saved_id) then
    raise exception 'Product was not deleted';
  end if;
end $$;
rollback;
