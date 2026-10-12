-- Transactional deployment verification: only synthetic rows, always rolled back.
begin;
select set_config('test.product_id', gen_random_uuid()::text, true);
select set_config('test.order_id', gen_random_uuid()::text, true);
insert into public.admin_allowlist(email) values ('deployment-check@example.invalid');
insert into public.orders(id, total) values (current_setting('test.order_id')::uuid, 100);
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","email":"deployment-check@example.invalid"}';
insert into public.products(id,name,slug,brand,price) values
  (current_setting('test.product_id')::uuid,'Deployment check',current_setting('test.product_id'),'Test brand',100);
insert into public.product_admin_data(product_id,cost_price,barcode) values
  (current_setting('test.product_id')::uuid,25,'RC2-DEPLOYMENT-CHECK');
update public.product_admin_data set cost_price=30 where product_id=current_setting('test.product_id')::uuid;
insert into public.coupons(code,value) values ('RC2-DEPLOYMENT-CHECK',15);
update public.coupons set active=false where code='RC2-DEPLOYMENT-CHECK';
update public.orders set shipping_status='in_transit',transaction_status='processed',tracking_number='TEST'
  where id=current_setting('test.order_id')::uuid;
do $$ begin
  if not exists(select 1 from public.product_admin_data where product_id=current_setting('test.product_id')::uuid and cost_price=30) then raise exception 'Admin private metadata failed'; end if;
  if not exists(select 1 from public.coupons where code='RC2-DEPLOYMENT-CHECK' and not active) then raise exception 'Admin coupon mutation failed'; end if;
  if not exists(select 1 from public.orders where id=current_setting('test.order_id')::uuid and shipping_status='in_transit' and status='pending') then raise exception 'Admin workflow mutation failed'; end if;
  begin
    update public.orders set status='approved' where id=current_setting('test.order_id')::uuid;
    raise exception 'Admin unexpectedly changed payment approval';
  exception when insufficient_privilege then null; end;
end $$;
set local request.jwt.claims = '{"role":"authenticated","email":"outside-allowlist@example.invalid"}';
do $$ declare changed integer; begin
  if exists(select 1 from public.product_admin_data) or exists(select 1 from public.coupons) or exists(select 1 from public.orders) then raise exception 'Private data leaked outside allowlist'; end if;
  update public.product_admin_data set cost_price=0 where product_id=current_setting('test.product_id')::uuid;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Unauthorized metadata update'; end if;
  update public.orders set shipping_status='delivered' where id=current_setting('test.order_id')::uuid;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Unauthorized workflow update'; end if;
  begin
    insert into public.coupons(code,value) values ('RC2-UNAUTHORIZED',10);
    raise exception 'Unauthorized coupon creation';
  exception when insufficient_privilege then null; end;
end $$;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$ begin
  begin
    if exists(select 1 from public.product_admin_data) then raise exception 'Private metadata leaked anonymously'; end if;
  exception when insufficient_privilege then null; end;
  begin
    if exists(select 1 from public.coupons) then raise exception 'Coupons leaked anonymously'; end if;
  exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","email":"deployment-check@example.invalid"}';
delete from public.products where id=current_setting('test.product_id')::uuid;
do $$ begin
  if exists(select 1 from public.product_admin_data where product_id=current_setting('test.product_id')::uuid) then raise exception 'Private metadata cascade failed'; end if;
end $$;
select 'PASS: authorized mutations, payment restriction, non-admin denial, anonymous isolation, product deletion' as result;
rollback;
