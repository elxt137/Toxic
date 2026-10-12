alter table public.storefront_settings
  add column whatsapp_number text check (whatsapp_number ~ '^[1-9][0-9]{7,14}$');

-- The public number is readable; its password verifier is never exposed.
create schema if not exists store_private;
revoke all on schema store_private from public, anon, authenticated;
grant usage on schema store_private to authenticated;
create table store_private.whatsapp_credentials (
  id boolean primary key default true check (id),
  password_hash text not null
);
alter table store_private.whatsapp_credentials enable row level security;
revoke all on table store_private.whatsapp_credentials from public, anon, authenticated;

-- Existing announcement edits remain possible. Number changes must use the RPC.
revoke update on table public.storefront_settings from authenticated;
grant update (announcement_text) on public.storefront_settings to authenticated;

create function store_private.update_whatsapp(p_number text, p_password text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare verifier text;
begin
  if (select auth.uid()) is null or not (select public.is_admin()) then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;
  if p_number is null or p_number !~ '^[1-9][0-9]{7,14}$' then
    raise exception 'Invalid international number' using errcode = '22023';
  end if;
  if p_password is null or char_length(p_password) not between 1 and 128 then return false; end if;
  select password_hash into verifier from store_private.whatsapp_credentials where id=true;
  if verifier is null or extensions.crypt(p_password, verifier) <> verifier then return false; end if;
  update public.storefront_settings set whatsapp_number=p_number where id=true;
  if not found then raise exception 'Store settings unavailable'; end if;
  return true;
end $$;
revoke all on function store_private.update_whatsapp(text,text) from public, anon;
grant execute on function store_private.update_whatsapp(text,text) to authenticated;

create function public.update_store_whatsapp(p_number text, p_password text)
returns boolean language sql security invoker set search_path = '' as $$
  select store_private.update_whatsapp(p_number,p_password);
$$;
revoke all on function public.update_store_whatsapp(text,text) from public, anon;
grant execute on function public.update_store_whatsapp(text,text) to authenticated;

-- Provision the bcrypt password hash separately. Never commit the password.
