begin;
do $$ begin
  if (select prosecdef from pg_proc where oid='public.is_admin()'::regprocedure) then raise exception 'Public admin helper is still privileged'; end if;
end $$;
insert into public.admin_allowlist(email) values ('security-check@example.invalid');
select set_config('test.security_order', gen_random_uuid()::text, true);
select set_config('test.security_product', gen_random_uuid()::text, true);
select set_config('test.security_variant', gen_random_uuid()::text, true);
insert into public.orders(id,total,currency,mercadopago_preference_id) values(current_setting('test.security_order')::uuid,100,'ARS','security-pref');
insert into public.products(id,name,slug,brand,price,is_published) values(current_setting('test.security_product')::uuid,'Security test',current_setting('test.security_product'),'Test brand',50,true);
insert into public.product_variants(id,product_id,label,price,stock) values(current_setting('test.security_variant')::uuid,current_setting('test.security_product')::uuid,'Unit',50,5);
insert into public.order_items(order_id,product_id,variant_id,variant_label,product_name,unit_price,quantity) values(current_setting('test.security_order')::uuid,current_setting('test.security_product')::uuid,current_setting('test.security_variant')::uuid,'Unit','Security test',50,2);
set local role authenticated;
set local request.jwt.claims='{"role":"authenticated","sub":"11111111-1111-4111-8111-111111111111","email":"security-check@example.invalid"}';
do $$ begin
  if not public.is_admin() then raise exception 'Authorized admin denied'; end if;
  begin perform public.consume_checkout_attempt(repeat('a',64));raise exception 'User accessed limiter';exception when insufficient_privilege then null;end;
  begin perform public.confirm_verified_order_payment(current_setting('test.security_order')::uuid,'123','approved',100,'ARS','security-pref');raise exception 'User approved payment';exception when insufficient_privilege then null;end;
end $$;
set local request.jwt.claims='{"role":"authenticated","email":"security-check@example.invalid"}';
do $$ begin if public.is_admin() then raise exception 'Missing identity accepted';end if;end $$;
set local request.jwt.claims='{"role":"authenticated","sub":"11111111-1111-4111-8111-111111111111","email":"outside-security@example.invalid"}';
do $$ begin if public.is_admin() then raise exception 'Outside whitelist accepted';end if;end $$;
set local role anon;
set local request.jwt.claims='{"role":"anon"}';
do $$ begin
  if public.is_admin() then raise exception 'Anonymous admin accepted';end if;
  begin perform 1 from store_private.whatsapp_credentials;raise exception 'Private credentials accessible';exception when insufficient_privilege then null;end;
end $$;
set local role service_role;
do $$ declare i integer; begin
  if public.confirm_verified_order_payment(current_setting('test.security_order')::uuid,'security-123','pending',1,'ARS','security-pref') then raise exception 'Wrong amount accepted';end if;
  if public.confirm_verified_order_payment(current_setting('test.security_order')::uuid,'security-123','pending',100,'USD','security-pref') then raise exception 'Wrong currency accepted';end if;
  if public.confirm_verified_order_payment(current_setting('test.security_order')::uuid,'security-123','pending',100,'ARS','other-pref') then raise exception 'Wrong preference accepted';end if;
  if not public.confirm_verified_order_payment(current_setting('test.security_order')::uuid,'security-123','pending',100,'ARS','security-pref') then raise exception 'Verified payment denied';end if;
  if not public.confirm_verified_order_payment(current_setting('test.security_order')::uuid,'security-123','approved',100,'ARS','security-pref') then raise exception 'Verified approval denied';end if;
  if not public.confirm_verified_order_payment(current_setting('test.security_order')::uuid,'security-123','approved',100,'ARS','security-pref') then raise exception 'Verified retry denied';end if;
  if (select stock from public.product_variants where id=current_setting('test.security_variant')::uuid)<>3 then raise exception 'Repeated notification decremented stock twice';end if;
  if public.confirm_verified_order_payment(current_setting('test.security_order')::uuid,'other-payment','approved',100,'ARS','security-pref') then raise exception 'Different payment replaced approved payment';end if;
  for i in 1..10 loop
    if not public.consume_checkout_attempt(repeat('a',64)) then raise exception 'Limiter rejected allowed attempt';end if;
  end loop;
  if public.consume_checkout_attempt(repeat('a',64)) then raise exception 'Client limiter failed';end if;
  for i in 1..89 loop
    if not public.consume_checkout_attempt(lpad(to_hex(i),64,'0')) then raise exception 'Global limit unexpectedly exhausted';end if;
  end loop;
  if public.consume_checkout_attempt(repeat('b',64)) then raise exception 'Global limit failed';end if;
  update store_private.checkout_rate_limits set window_started=now()-interval '6 minutes' where bucket in ('global',repeat('a',64));
  if not public.consume_checkout_attempt(repeat('a',64)) then raise exception 'Expired request window did not reset';end if;
  insert into store_private.checkout_rate_limits(bucket,window_started,hits) values(repeat('f',64),now()-interval '2 hours',1);
  perform public.consume_checkout_attempt(repeat('c',64));
  if exists(select 1 from store_private.checkout_rate_limits where bucket=repeat('f',64)) then raise exception 'Expired limiter records retained';end if;
  begin perform public.consume_checkout_attempt('invalid');raise exception 'Invalid limiter key accepted';exception when raise_exception then if sqlerrm<>'Invalid request key' then raise;end if;end;
end $$;
select 'PASS: private helper, verified identity, whitelist, payment binding and shared request limits' as result;
rollback;
