begin;
select set_config('test.user_id',gen_random_uuid()::text,true);
select set_config('test.other_id',gen_random_uuid()::text,true);
select set_config('test.order_id',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at) values
  (current_setting('test.user_id')::uuid,'crm-check@example.invalid',now()),
  (current_setting('test.other_id')::uuid,'crm-other@example.invalid',now());
insert into public.admin_allowlist(email) values('crm-admin@example.invalid');
insert into public.orders(id,total,payer_name,payer_email,buyer_phone,shipping_city)
values(current_setting('test.order_id')::uuid,100,'CRM Test','crm-check@example.invalid','123456','Test city');
do $$ begin
  if exists(select 1 from public.customers where email='crm-check@example.invalid') then raise exception 'Pending orders must not register paid customers'; end if;
end $$;
update public.orders set status='approved' where id=current_setting('test.order_id')::uuid;
do $$ begin
  if not exists(select 1 from public.customers where email='crm-check@example.invalid' and phone='123456') then raise exception 'Paid customer missing'; end if;
  if not exists(select 1 from public.orders where id=current_setting('test.order_id')::uuid and customer_id is not null) then raise exception 'Paid order not linked'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('test.user_id'),'email','crm-admin@example.invalid')::text,true);
update public.storefront_settings set free_shipping_threshold=150000,free_shipping_enabled=false where id=true;
update public.customer_groups set discount_percent=15 where slug='professional';
update public.customers set group_id=(select id from public.customer_groups where slug='professional') where email='crm-check@example.invalid';
do $$ begin
  if (select free_shipping_threshold from public.storefront_settings where id=true)<>150000 then raise exception 'Admin cart settings failed'; end if;
  begin
    update public.storefront_settings set whatsapp_number='5491100000000' where id=true;
    raise exception 'Cart settings bypassed WhatsApp password';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('test.user_id'),'email','crm-check@example.invalid')::text,true);
do $$ begin
  if exists(select 1 from public.customers) or exists(select 1 from public.customer_groups) then raise exception 'CRM leaked to customer'; end if;
  if (public.get_my_customer_benefit()->>'discount_percent')::numeric<>15 then raise exception 'Verified discount missing'; end if;
  begin
    insert into public.customer_groups(slug,name,discount_percent) values('unauthorized','Invalid',99);
    raise exception 'Customer created pricing group';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('test.other_id'),'email','crm-check@example.invalid')::text,true);
do $$ begin
  if public.get_my_customer_benefit() is not null then raise exception 'Spoofed email granted discount'; end if;
end $$;
set local role anon;
set local request.jwt.claims='{"role":"anon"}';
do $$ begin
  begin
    perform public.get_my_customer_benefit();
    raise exception 'Anonymous discount RPC allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform email from public.customers;
    raise exception 'CRM contacts exposed anonymously';
  exception when insufficient_privilege then null; end;
end $$;
select 'PASS: paid registration, linked history, admin configuration, private CRM, verified discounts, spoof rejection, WhatsApp isolation' as result;
rollback;
