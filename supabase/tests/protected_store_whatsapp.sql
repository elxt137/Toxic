-- Only synthetic credentials and claims; transaction rollback restores all settings.
begin;
insert into public.admin_allowlist(email) values ('whatsapp-test@example.invalid');
insert into store_private.whatsapp_credentials(id,password_hash)
values (true,extensions.crypt('test-password',extensions.gen_salt('bf',10)))
on conflict(id) do update set password_hash=excluded.password_hash;
update public.storefront_settings set whatsapp_number='5491100000000' where id=true;
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"11111111-1111-4111-8111-111111111111","email":"whatsapp-test@example.invalid"}';
do $$ begin
  if public.update_store_whatsapp('5491112345678','wrong-password') then raise exception 'Wrong password accepted'; end if;
  if (select whatsapp_number from public.storefront_settings where id=true) <> '5491100000000' then raise exception 'Wrong password changed number'; end if;
  if not public.update_store_whatsapp('5491112345678','test-password') then raise exception 'Correct password rejected'; end if;
  if (select whatsapp_number from public.storefront_settings where id=true) <> '5491112345678' then raise exception 'Number not saved'; end if;
  begin
    perform public.update_store_whatsapp('bad-number','test-password');
    raise exception 'Invalid number accepted';
  exception when invalid_parameter_value then null; end;
  begin
    update public.storefront_settings set whatsapp_number='5491100000000' where id=true;
    raise exception 'Direct update bypassed password';
  exception when insufficient_privilege then null; end;
  begin
    perform password_hash from store_private.whatsapp_credentials;
    raise exception 'Password hash readable by authenticated user';
  exception when insufficient_privilege then null; end;
end $$;
update public.storefront_settings set announcement_text='Test announcement' where id=true;
do $$ begin
  if (select announcement_text from public.storefront_settings where id=true) <> 'Test announcement' then raise exception 'Announcement update regressed'; end if;
end $$;
set local request.jwt.claims = '{"role":"authenticated","sub":"22222222-2222-4222-8222-222222222222","email":"outside-allowlist@example.invalid"}';
do $$ begin
  begin
    perform public.update_store_whatsapp('5491100000000','test-password');
    raise exception 'Non-admin with password changed number';
  exception when insufficient_privilege then null; end;
end $$;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$ begin
  if (select whatsapp_number from public.storefront_settings where id=true) <> '5491112345678' then raise exception 'Public contact unavailable'; end if;
  begin
    perform public.update_store_whatsapp('5491100000000','test-password');
    raise exception 'Anonymous update allowed';
  exception when insufficient_privilege then null; end;
end $$;
select 'PASS: password, admin authorization, direct-update protection, private verifier, public contact, announcement compatibility' as result;
rollback;
