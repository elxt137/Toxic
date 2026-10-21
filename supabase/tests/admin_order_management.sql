-- All test rows and effects are rolled back. No real customer or payment data.
begin;
select set_config('test.admin_id',gen_random_uuid()::text,true);
select set_config('test.order_id',gen_random_uuid()::text,true);
select set_config('test.variant_id',gen_random_uuid()::text,true);
select set_config('test.product_id',gen_random_uuid()::text,true);
select set_config('test.admin_email','order-test-'||gen_random_uuid()::text||'@example.invalid',true);
insert into public.admin_allowlist(email) values(current_setting('test.admin_email'));
insert into public.products(id,name,slug,brand,price,stock,category)
values(current_setting('test.product_id')::uuid,'Order test product','order-test-'||gen_random_uuid()::text,'Test',100,5,'lavado');
insert into public.product_variants(id,product_id,label,price,stock) values(current_setting('test.variant_id')::uuid,current_setting('test.product_id')::uuid,'Test variant',100,5);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.admin_id'),'email','unlisted@example.invalid','role','authenticated')::text,true);
set local role authenticated;
do $$ begin
  begin
    perform public.approve_bank_transfer(current_setting('test.order_id')::uuid);
    raise exception 'Unauthorized approval accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.create_bank_transfer_order(current_setting('test.order_id')::uuid,'{}','[]');
    raise exception 'Unauthorized registration accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.admin_id'),'email',current_setting('test.admin_email'),'role','authenticated')::text,true);
set local role authenticated;
do $$
declare customer jsonb:=jsonb_build_object('name','Test buyer','email','order-buyer-'||gen_random_uuid()::text||'@example.invalid','phone','5492984000000','delivery','pickup','address','Retiro de prueba');
  lines jsonb:=jsonb_build_array(jsonb_build_object('variant_id',current_setting('test.variant_id'),'quantity',2));
  saved uuid;
begin
  saved:=public.create_bank_transfer_order(current_setting('test.order_id')::uuid,customer,lines);
  if public.create_bank_transfer_order(saved,customer,lines)<>saved then raise exception 'Retry created another order'; end if;
  if (select total from public.orders where id=saved)<>200 or (select count(*) from public.order_items where order_id=saved)<>1 then raise exception 'Wrong totals or duplicated lines'; end if;
  if (select stock from public.product_variants where id=current_setting('test.variant_id')::uuid)<>5 then raise exception 'Pending order deducted stock'; end if;
  if not public.approve_bank_transfer(saved) or not public.approve_bank_transfer(saved) then raise exception 'Approval failed'; end if;
  if (select stock from public.product_variants where id=current_setting('test.variant_id')::uuid)<>3 then raise exception 'Duplicate stock deduction'; end if;
  if not exists(select 1 from public.orders where id=saved and status='approved' and paid_at is not null and payment_confirmed_by=current_setting('test.admin_id')::uuid) then raise exception 'Missing payment audit'; end if;
  begin
    update public.orders set status='approved' where id=saved;
    raise exception 'Direct status bypass allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Create a mixed order to verify full stock rollback when one line is unavailable.
select set_config('test.insufficient_id',gen_random_uuid()::text,true);
select set_config('test.empty_variant_id',gen_random_uuid()::text,true);
insert into public.product_variants(id,product_id,label,price,stock) values(current_setting('test.empty_variant_id')::uuid,current_setting('test.product_id')::uuid,'No stock',100,0);
insert into public.orders(id,status,total,payment_method) values(current_setting('test.insufficient_id')::uuid,'pending',200,'bank_transfer');
insert into public.order_items(order_id,product_id,variant_id,variant_label,product_name,unit_price,quantity)
values(current_setting('test.insufficient_id')::uuid,current_setting('test.product_id')::uuid,current_setting('test.variant_id')::uuid,'Test variant','Order test product',100,1),
(current_setting('test.insufficient_id')::uuid,current_setting('test.product_id')::uuid,current_setting('test.empty_variant_id')::uuid,'No stock','Order test product',100,1);
set local role authenticated;
do $$ begin
  begin
    perform public.approve_bank_transfer(current_setting('test.insufficient_id')::uuid);
    raise exception 'Insufficient stock accepted' using errcode='22000';
  exception when raise_exception then null; end;
  if (select stock from public.product_variants where id=current_setting('test.variant_id')::uuid)<>3 or (select status from public.orders where id=current_setting('test.insufficient_id')::uuid)<>'pending' then raise exception 'Partial deduction was not rolled back'; end if;
end $$;
reset role;
update public.orders set payment_method='mercadopago' where id=current_setting('test.insufficient_id')::uuid;
set local role authenticated;
do $$ begin
  if public.approve_bank_transfer(current_setting('test.insufficient_id')::uuid) then raise exception 'Manual MP approval accepted'; end if;
end $$;
reset role;
update public.orders set payment_method='bank_transfer',status='cancelled' where id=current_setting('test.insufficient_id')::uuid;
set local role authenticated;
do $$ begin
  if public.approve_bank_transfer(current_setting('test.insufficient_id')::uuid) then raise exception 'Cancelled order approved'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  if exists(select 1 from storage.objects where bucket_id='transfer-receipts') then raise exception 'Private receipts exposed'; end if;
end $$;
reset role;
select set_config('test.mp_order_id',gen_random_uuid()::text,true);
select set_config('test.payment_id',(1000000000000+floor(random()*1000000000000))::bigint::text,true);
insert into public.orders(id,status,total,mercadopago_preference_id) values(current_setting('test.mp_order_id')::uuid,'pending',100,'order-management-test-preference');
insert into public.order_items(order_id,product_id,variant_id,variant_label,product_name,unit_price,quantity)
values(current_setting('test.mp_order_id')::uuid,current_setting('test.product_id')::uuid,current_setting('test.variant_id')::uuid,'Test variant','Order test product',100,1);
set local role service_role;
do $$ begin
  if public.record_verified_payment(current_setting('test.mp_order_id')::uuid,current_setting('test.payment_id'),'approved',1,'ARS','order-management-test-preference','credit_card','2026-10-20T12:00:00Z') then raise exception 'Mismatched payment accepted'; end if;
  if not public.record_verified_payment(current_setting('test.mp_order_id')::uuid,current_setting('test.payment_id'),'approved',100,'ARS','order-management-test-preference','credit_card','2026-10-20T12:00:00Z') then raise exception 'Verified payment failed'; end if;
  if not public.record_verified_payment(current_setting('test.mp_order_id')::uuid,current_setting('test.payment_id'),'pending',100,'ARS','order-management-test-preference',null,null) then raise exception 'Duplicate notification failed'; end if;
  if (select stock from public.product_variants where id=current_setting('test.variant_id')::uuid)<>2 then raise exception 'MP repeated stock deduction'; end if;
  if not exists(select 1 from public.orders where id=current_setting('test.mp_order_id')::uuid and status='approved' and payment_type='credit_card' and paid_at='2026-10-20T12:00:00Z') then raise exception 'Payment details lost or downgraded'; end if;
end $$;
rollback;
