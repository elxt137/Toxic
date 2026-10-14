-- Keep the privileged lookup out of exposed schemas. Signed Auth identity is mandatory.
create function store_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists(
    select 1 from public.admin_allowlist
    where email=lower(coalesce((select auth.jwt())->>'email','')) and is_active
  );
$$;
revoke all on function store_private.is_admin() from public;
grant usage on schema store_private to anon,authenticated,service_role;
grant execute on function store_private.is_admin() to anon,authenticated;
create or replace function public.is_admin() returns boolean
language sql stable security invoker set search_path = '' as $$ select store_private.is_admin(); $$;

-- Limits are shared by all Node processes. No IPs or emails are stored.
create table store_private.checkout_rate_limits (
  bucket text primary key,
  window_started timestamptz not null,
  hits integer not null check(hits between 1 and 101)
);
alter table store_private.checkout_rate_limits enable row level security;
revoke all on store_private.checkout_rate_limits from public,anon,authenticated;
grant select,insert,update,delete on store_private.checkout_rate_limits to service_role;
create function public.consume_checkout_attempt(p_key text) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare count_hits integer;
begin
  if p_key is null or p_key !~ '^[0-9a-f]{64}$' then raise exception 'Invalid request key';end if;
  delete from store_private.checkout_rate_limits where window_started < now()-interval '1 hour';
  insert into store_private.checkout_rate_limits as current_limit(bucket,window_started,hits) values('global',now(),1)
  on conflict(bucket) do update set
    hits=case when current_limit.window_started<=now()-interval '5 minutes' then 1 else least(current_limit.hits+1,101) end,
    window_started=case when current_limit.window_started<=now()-interval '5 minutes' then now() else current_limit.window_started end
  returning hits into count_hits;
  if count_hits>100 then return false;end if;
  insert into store_private.checkout_rate_limits as current_limit(bucket,window_started,hits) values(p_key,now(),1)
  on conflict(bucket) do update set
    hits=case when current_limit.window_started<=now()-interval '5 minutes' then 1 else least(current_limit.hits+1,11) end,
    window_started=case when current_limit.window_started<=now()-interval '5 minutes' then now() else current_limit.window_started end
  returning hits into count_hits;
  return count_hits<=10;
end $$;
revoke all on function public.consume_checkout_attempt(text) from public,anon,authenticated;
grant execute on function public.consume_checkout_attempt(text) to service_role;

create unique index orders_unique_provider_payment_idx on public.orders(mercadopago_payment_id) where mercadopago_payment_id is not null;
create function public.confirm_verified_order_payment(p_order_id uuid,p_payment_id text,p_status text,p_amount numeric,p_currency text,p_preference_id text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare target public.orders%rowtype;
begin
  select * into target from public.orders where id=p_order_id for update;
  if not found or p_payment_id is null or p_payment_id='' or target.total is distinct from p_amount or target.currency is distinct from p_currency
    or target.mercadopago_preference_id is null or target.mercadopago_preference_id is distinct from p_preference_id then return false;end if;
  if target.status='approved' then return target.mercadopago_payment_id=p_payment_id;end if;
  if exists(select 1 from public.orders where mercadopago_payment_id=p_payment_id and id<>p_order_id) then return false;end if;
  return public.confirm_order_payment(p_order_id,p_payment_id,p_status);
end $$;
revoke all on function public.confirm_verified_order_payment(uuid,text,text,numeric,text,text) from public,anon,authenticated;
grant execute on function public.confirm_verified_order_payment(uuid,text,text,numeric,text,text) to service_role;
